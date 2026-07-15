<?php

$secret = base32_encode_bytes(random_bytes(20));
$stmt = $conn->prepare("UPDATE admin_users SET totp_secret_pending = ? WHERE id = ?");
$stmt->bind_param("si", $secret, $userId);
$stmt->execute(); $stmt->close();
$stmt = $conn->prepare("SELECT username FROM admin_users WHERE id = ?");
$stmt->bind_param("i", $userId); $stmt->execute();
$uname = $stmt->get_result()->fetch_assoc()['username']; $stmt->close();
$uri = "otpauth://totp/Harvest%20Admin:" . rawurlencode($uname) . "?secret={$secret}&issuer=Harvest%20Admin&digits=6&period=30";
echo json_encode(["success" => true, "code" => 200, "secret" => $secret, "otpauthUri" => $uri]);