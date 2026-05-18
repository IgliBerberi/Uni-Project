<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/db_connect.php';
require_once __DIR__ . '/../../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        $input = readJsonBody();
        $action = $action ?: ($input['action'] ?? '');

        if ($action === 'register') {
            $businessName = trim($input['business_name'] ?? '');
            $email = strtolower(trim($input['email'] ?? ''));
            $password = $input['password'] ?? '';

            if ($businessName === '') {
                jsonResponse(false, null, 'Business name is required.', 422);
            }
            if (!isValidEmail($email)) {
                jsonResponse(false, null, 'Valid email is required.', 422);
            }
            $passwordError = validatePassword($password);
            if ($passwordError) {
                jsonResponse(false, null, $passwordError, 422);
            }

            $check = $pdo->prepare('SELECT id FROM businesses WHERE email = :email');
            $check->execute([':email' => $email]);
            if ($check->fetch()) {
                jsonResponse(false, null, 'Email is already registered.', 409);
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare(
                'INSERT INTO businesses (business_name, email, password_hash)
                 VALUES (:business_name, :email, :password_hash)'
            );
            $stmt->execute([
                ':business_name' => $businessName,
                ':email' => $email,
                ':password_hash' => $hash,
            ]);

            $businessId = (int) $pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT id, business_name, email, created_at FROM businesses WHERE id = :id');
            $stmt->execute([':id' => $businessId]);
            $business = $stmt->fetch();
            session_regenerate_id(true);
            setBusinessSession($business);

            jsonResponse(true, ['business' => publicBusinessRow($business)], 'Business account created.', 201);
        }

        if ($action === 'login') {
            $email = strtolower(trim($input['email'] ?? ''));
            $password = $input['password'] ?? '';

            if (!isValidEmail($email) || $password === '') {
                jsonResponse(false, null, 'Email and password are required.', 422);
            }

            $stmt = $pdo->prepare(
                'SELECT id, business_name, email, password_hash, created_at FROM businesses WHERE email = :email'
            );
            $stmt->execute([':email' => $email]);
            $row = $stmt->fetch();

            if (!$row || !password_verify($password, $row['password_hash'])) {
                jsonResponse(false, null, 'Invalid email or password.', 401);
            }

            session_regenerate_id(true);
            setBusinessSession($row);
            jsonResponse(true, ['business' => publicBusinessRow($row)], 'Logged in.');
        }

        jsonResponse(false, null, 'Unknown action. Use register or login.', 400);
        break;

    case 'GET':
        if ($action === 'me') {
            $business = requireBusinessAuth($pdo);
            jsonResponse(true, ['business' => $business]);
        }
        jsonResponse(false, null, 'Unknown action. Use me.', 400);
        break;

    case 'DELETE':
        clearBusinessSession();
        jsonResponse(true, null, 'Logged out.');
        break;

    default:
        jsonResponse(false, null, 'Method not allowed.', 405);
}
