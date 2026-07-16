<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../mfaHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli(
        $dbConfig['db_host'],
        $dbConfig['db_username'],
        $dbConfig['db_password'],
        $dbConfig['db_name']
    );

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) { $data = []; }


    if (($data['action'] ?? '') === 'dismiss_passkey_prompt') {
        $stmt = $conn->prepare("UPDATE admin_users SET passkey_prompt_declined = 1 WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => true, "code" => 200]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT password_hash, name, username, email, email_verified_at, totp_secret
         FROM admin_users WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $current = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$current) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $currentPassword = (string)($data['current_password'] ?? '');
    $storedHash      = (string)($current['password_hash'] ?? '');

    $passwordOk = $storedHash !== '' && (
        password_verify($currentPassword, $storedHash) ||
        hash_equals($storedHash, hash('sha256', $currentPassword))
    );

    if (!$passwordOk) {
        echo json_encode(["success" => false, "message" => "Current password is incorrect", "code" => 401]);
        exit;
    }

    $newName     = array_key_exists('name', $data)     ? trim((string)$data['name'])     : (string)$current['name'];
    $newUsername = array_key_exists('username', $data) ? trim((string)$data['username']) : (string)$current['username'];
    $newPassword = (string)($data['new_password'] ?? '');

    $emailProvided = array_key_exists('email', $data);
    $newEmail      = $emailProvided ? trim((string)$data['email']) : (string)($current['email'] ?? '');

    if ($newName === '') {
        echo json_encode(["success" => false, "message" => "Name cannot be empty", "code" => 400]);
        exit;
    }

    if (strlen($newUsername) < 3 || strlen($newUsername) > 20 || !preg_match('/^[a-zA-Z0-9_]+$/', $newUsername)) {
        echo json_encode([
            "success" => false,
            "message" => "Username must be 3-20 characters, letters, numbers and underscores only",
            "code"    => 400
        ]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = ? AND id != ?");
    $stmt->bind_param("si", $newUsername, $userId);
    $stmt->execute();
    $taken = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($taken) {
        echo json_encode(["success" => false, "message" => "Username already exists", "code" => 400]);
        exit;
    }

    $currentEmail   = (string)($current['email'] ?? '');
    $emailChanged   = false;
    $emailCleared   = false;
    $verifyRequired = false;
    $verifySent     = false;
    $verifyMessage  = null;

    if ($emailProvided) {
        $normalisedNew     = strtolower($newEmail);
        $normalisedCurrent = strtolower($currentEmail);

        if ($normalisedNew !== $normalisedCurrent) {
            if ($newEmail === '') {
                $emailCleared = true;
            } else {
                if (!is_valid_admin_email($newEmail)) {
                    echo json_encode([
                        "success" => false,
                        "message" => "Email must be a valid @harvestschools.com or @alfajralbasem.com address",
                        "code"    => 400
                    ]);
                    exit;
                }

                $stmt = $conn->prepare(
                    "SELECT id FROM admin_users
                     WHERE (LOWER(email) = LOWER(?) OR LOWER(pending_email) = LOWER(?)) AND id != ?"
                );
                $stmt->bind_param("ssi", $newEmail, $newEmail, $userId);
                $stmt->execute();
                $emailTaken = $stmt->get_result()->num_rows > 0;
                $stmt->close();

                if ($emailTaken) {
                    echo json_encode([
                        "success" => false,
                        "message" => "That email is already used by another admin account",
                        "code"    => 400
                    ]);
                    exit;
                }

                $emailChanged   = true;
                $verifyRequired = true;
            }
        }
    }

    if ($emailCleared) {
        $mfaInfo   = get_available_mfa_methods($conn, $userId);
        $remaining = array_values(array_diff($mfaInfo['methods'], ['email']));

        if (empty($remaining)) {
            echo json_encode([
                "success" => false,
                "message" => "You cannot remove your email while it is your only login verification method. Add a passkey or an authenticator app first.",
                "code"    => 400
            ]);
            exit;
        }
    }

    if ($newPassword !== '') {
        if (strlen($newPassword) < 8 ||
            !preg_match('/[A-Z]/', $newPassword) ||
            !preg_match('/[a-z]/', $newPassword) ||
            !preg_match('/[0-9]/', $newPassword) ||
            !preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
            echo json_encode([
                "success" => false,
                "message" => "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol",
                "code"    => 400
            ]);
            exit;
        }

        if (password_verify($newPassword, $storedHash)) {
            echo json_encode([
                "success" => false,
                "message" => "New password must be different from your current password",
                "code"    => 400
            ]);
            exit;
        }
    }

    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("UPDATE admin_users SET name = ?, username = ? WHERE id = ?");
        $stmt->bind_param("ssi", $newName, $newUsername, $userId);
        $stmt->execute();
        $stmt->close();

        if ($emailCleared) {
            $stmt = $conn->prepare(
                "UPDATE admin_users
                 SET email = NULL, email_verified_at = NULL,
                     pending_email = NULL, pending_email_set_at = NULL,
                     preferred_mfa = IF(preferred_mfa = 'email', NULL, preferred_mfa)
                 WHERE id = ?"
            );
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $stmt->close();
        }

        if ($emailChanged) {
            $stmt = $conn->prepare(
                "UPDATE admin_users SET pending_email = ?, pending_email_set_at = NOW() WHERE id = ?"
            );
            $stmt->bind_param("si", $newEmail, $userId);
            $stmt->execute();
            $stmt->close();
        }

        if ($newPassword !== '') {
            $hash = password_hash($newPassword, PASSWORD_DEFAULT);

            $stmt = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
            $stmt->bind_param("si", $hash, $userId);
            $stmt->execute();
            $stmt->close();

            $currentTokenHash = get_bearer_token_hash();
            $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ? AND id != ?");
            $stmt->bind_param("is", $userId, $currentTokenHash);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

    if ($emailChanged) {
        $ownerKey = mfa_owner_key_for_user($userId);
        $state    = mfa_send_state($conn, 'email_verify', $ownerKey);

        if ($state['allowed']) {
            mfa_record_send($conn, 'email_verify', $ownerKey, $userId);
            $code       = mfa_issue_email_code($conn, 'email_verify', $ownerKey, $userId, $newEmail);
            $verifySent = mfa_send_code_email($newEmail, $code, 'email_verify');

            $verifyMessage = $verifySent
                ? "We sent a 6-digit code to {$newEmail}. Enter it to confirm the address."
                : "We saved the address but could not send the code. Use Resend to try again.";
        } else {
            $verifyMessage = "Please wait before requesting another verification code.";
        }
    }

    $message = 'Account updated.';
    if ($newPassword !== '') { $message = 'Account updated. Other devices have been signed out.'; }
    if ($emailCleared)       { $message = 'Account updated. Your email has been removed.'; }

    $after = mfa_send_state($conn, 'email_verify', mfa_owner_key_for_user($userId));

    echo json_encode([
        "success"                  => true,
        "message"                  => $message,
        "code"                     => 200,
        "emailVerificationRequired" => $verifyRequired,
        "pendingEmail"             => $emailChanged ? $newEmail : null,
        "verificationSent"         => $verifySent,
        "verificationMessage"      => $verifyMessage,
        "retryAfter"               => (int)$after['retry_after'],
        "passwordChanged"          => $newPassword !== '',
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
