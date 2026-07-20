<?php

require_once __DIR__ . '/mfaHelpers.php';

function step_up_actions() {
    return ['update_profile', 'change_email', 'remove_email', 'setup_totp', 'remove_totp', 'remove_passkey'];
}

function step_up_would_strip_last_method($conn, $userId, $method) {
    $info = get_available_mfa_methods($conn, $userId);

    return empty(array_diff($info['methods'], [$method]));
}

function validate_step_up_action($conn, $userId, $action, $payload) {
    switch ($action) {
        case 'update_profile':
            $name     = trim((string)($payload['name'] ?? ''));
            $username = trim((string)($payload['username'] ?? ''));
            $password = (string)($payload['new_password'] ?? '');

            if ($name === '') {
                return ["success" => false, "message" => "Name cannot be empty", "code" => 400];
            }

            if (strlen($username) < 3 || strlen($username) > 20 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
                return ["success" => false, "message" => "Username must be 3-20 characters, letters, numbers and underscores only", "code" => 400];
            }

            $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = ? AND id != ?");
            $stmt->bind_param("si", $username, $userId);
            $stmt->execute();
            $taken = $stmt->get_result()->num_rows > 0;
            $stmt->close();

            if ($taken) {
                return ["success" => false, "message" => "Username already exists", "code" => 400];
            }

            if ($password !== '') {
                if (strlen($password) < 8 ||
                    !preg_match('/[A-Z]/', $password) ||
                    !preg_match('/[a-z]/', $password) ||
                    !preg_match('/[0-9]/', $password) ||
                    !preg_match('/[^a-zA-Z0-9]/', $password)) {
                    return ["success" => false, "message" => "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol", "code" => 400];
                }

                $stmt = $conn->prepare("SELECT password_hash FROM admin_users WHERE id = ?");
                $stmt->bind_param("i", $userId);
                $stmt->execute();
                $hash = (string)($stmt->get_result()->fetch_assoc()['password_hash'] ?? '');
                $stmt->close();

                if ($hash !== '' && password_verify($password, $hash)) {
                    return ["success" => false, "message" => "New password must be different from your current password", "code" => 400];
                }
            }

            return null;

        case 'change_email':
            $email = trim((string)($payload['email'] ?? ''));

            if (!is_valid_admin_email($email)) {
                return ["success" => false, "message" => "Email must be a valid @harvestschools.com or @alfajralbasem.com address", "code" => 400];
            }

            return null;

        case 'remove_email':
            if (step_up_would_strip_last_method($conn, $userId, 'email')) {
                return ["success" => false, "message" => "Your email is your only login verification method. Add a passkey or an authenticator app first.", "code" => 400];
            }

            return null;

        case 'remove_totp':
            if (step_up_would_strip_last_method($conn, $userId, 'totp')) {
                return ["success" => false, "message" => "Your authenticator app is your only login verification method. Add a verified email or a passkey first.", "code" => 400];
            }

            return null;

        case 'remove_passkey':
            $passkeyId = $payload['passkey_id'] ?? null;

            if (!is_numeric($passkeyId)) {
                return ["success" => false, "message" => "Valid passkey ID is required", "code" => 400];
            }

            $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM admin_passkeys WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $total = (int)$stmt->get_result()->fetch_assoc()['c'];
            $stmt->close();

            if ($total === 1 && step_up_would_strip_last_method($conn, $userId, 'passkey')) {
                return ["success" => false, "message" => "This is your last passkey and your only login verification method. Add a verified email or an authenticator app first.", "code" => 400];
            }

            return null;

        case 'setup_totp':
            return null;
    }

    return ["success" => false, "message" => "Unknown action", "code" => 400];
}

function execute_step_up_action($conn, $userId, $action, $payload) {
    $invalid = validate_step_up_action($conn, $userId, $action, $payload);
    if ($invalid !== null) { return $invalid; }

    switch ($action) {
        case 'update_profile':
            $name     = trim((string)($payload['name'] ?? ''));
            $username = trim((string)($payload['username'] ?? ''));
            $password = (string)($payload['new_password'] ?? '');

            $stmt = $conn->prepare("UPDATE admin_users SET name = ?, username = ? WHERE id = ?");
            $stmt->bind_param("ssi", $name, $username, $userId);
            $stmt->execute();
            $stmt->close();

            if ($password !== '') {
                $hash = password_hash($password, PASSWORD_DEFAULT);

                $stmt = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
                $stmt->bind_param("si", $hash, $userId);
                $stmt->execute();
                $stmt->close();

                $currentTokenHash = get_bearer_token_hash();
                $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ? AND id != ?");
                $stmt->bind_param("is", $userId, $currentTokenHash);
                $stmt->execute();
                $stmt->close();

                log_admin_event($conn, $userId, 'password_changed', null);

                return ["success" => true, "message" => "Account updated. Other devices have been signed out.", "code" => 200];
            }

            return ["success" => true, "message" => "Account updated.", "code" => 200];

        case 'change_email':
            return start_email_verification($conn, $userId, trim((string)($payload['email'] ?? '')));

        case 'remove_email':
            $stmt = $conn->prepare(
                "UPDATE admin_users
                 SET email = NULL, email_verified_at = NULL, pending_email = NULL, pending_email_set_at = NULL,
                     preferred_mfa = IF(preferred_mfa = 'email', NULL, preferred_mfa)
                 WHERE id = ?"
            );
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $stmt->close();

            log_admin_event($conn, $userId, 'email_removed', null);

            return ["success" => true, "message" => "Email removed.", "code" => 200];

        case 'setup_totp':
            return start_totp_enrolment($conn, $userId);

        case 'remove_totp':
            $stmt = $conn->prepare(
                "UPDATE admin_users
                 SET totp_secret = NULL, totp_secret_pending = NULL, totp_secret_pending_at = NULL,
                     last_totp_slice = NULL, preferred_mfa = IF(preferred_mfa = 'totp', NULL, preferred_mfa)
                 WHERE id = ?"
            );
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $stmt->close();

            log_admin_event($conn, $userId, 'totp_removed', null);

            return ["success" => true, "message" => "Authenticator app removed.", "code" => 200];

        case 'remove_passkey':
            $passkeyId = (int)$payload['passkey_id'];

            $stmt = $conn->prepare("DELETE FROM admin_passkeys WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $passkeyId, $userId);
            $stmt->execute();
            $deleted = $stmt->affected_rows;
            $stmt->close();

            if ($deleted === 0) {
                return ["success" => false, "message" => "Passkey not found", "code" => 404];
            }

            $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM admin_passkeys WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $remaining = (int)$stmt->get_result()->fetch_assoc()['c'];
            $stmt->close();

            if ($remaining === 0) {
                $stmt = $conn->prepare("UPDATE admin_users SET preferred_mfa = NULL, passkey_prompt_declined = 0 WHERE id = ? AND preferred_mfa = 'passkey'");
                $stmt->bind_param("i", $userId);
                $stmt->execute();
                $stmt->close();
            }

            log_admin_event($conn, $userId, 'passkey_removed', null);

            return ["success" => true, "message" => "Passkey removed.", "remainingPasskeys" => $remaining, "code" => 200];
    }

    return ["success" => false, "message" => "Unknown action", "code" => 400];
}

function start_totp_enrolment($conn, $userId) {
    $stmt = $conn->prepare("SELECT username, totp_secret FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return ["success" => false, "message" => "User not found", "code" => 404];
    }

    $secret = base32_encode_bytes(random_bytes(20));

    $stmt = $conn->prepare("UPDATE admin_users SET totp_secret_pending = ?, totp_secret_pending_at = NOW() WHERE id = ?");
    $stmt->bind_param("si", $secret, $userId);
    $stmt->execute();
    $stmt->close();

    $issuer = rawurlencode('Harvest Schools Admin');
    $label  = $issuer . ':' . rawurlencode($row['username']);

    return [
        "success"       => true,
        "code"          => 200,
        "secret"        => $secret,
        "otpauthUri"    => "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30",
        "expiresIn"     => (int)mfa_config('totp_pending_ttl_seconds'),
        "isReplacement" => !empty($row['totp_secret']),
    ];
}