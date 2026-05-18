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
            $fullName = trim($input['full_name'] ?? '');
            $email = strtolower(trim($input['email'] ?? ''));
            $password = $input['password'] ?? '';

            if ($fullName === '') {
                jsonResponse(false, null, 'Full name is required.', 422);
            }
            if (!isValidEmail($email)) {
                jsonResponse(false, null, 'Valid email is required.', 422);
            }
            $passwordError = validatePassword($password);
            if ($passwordError) {
                jsonResponse(false, null, $passwordError, 422);
            }

            $check = $pdo->prepare('SELECT id FROM users WHERE email = :email');
            $check->execute([':email' => $email]);
            if ($check->fetch()) {
                jsonResponse(false, null, 'Email is already registered.', 409);
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare(
                'INSERT INTO users (full_name, email, password_hash) VALUES (:full_name, :email, :password_hash)'
            );
            $stmt->execute([
                ':full_name' => $fullName,
                ':email' => $email,
                ':password_hash' => $hash,
            ]);

            $userId = (int) $pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT id, full_name, email, created_at FROM users WHERE id = :id');
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            session_regenerate_id(true);
            setUserSession($user);

            jsonResponse(true, ['user' => publicUserRow($user)], 'Account created.', 201);
        }

        if ($action === 'login') {
            $email = strtolower(trim($input['email'] ?? ''));
            $password = $input['password'] ?? '';

            if (!isValidEmail($email) || $password === '') {
                jsonResponse(false, null, 'Email and password are required.', 422);
            }

            $stmt = $pdo->prepare('SELECT id, full_name, email, password_hash, created_at FROM users WHERE email = :email');
            $stmt->execute([':email' => $email]);
            $row = $stmt->fetch();

            if (!$row || !password_verify($password, $row['password_hash'])) {
                jsonResponse(false, null, 'Invalid email or password.', 401);
            }

            session_regenerate_id(true);
            setUserSession($row);
            jsonResponse(true, ['user' => publicUserRow($row)], 'Logged in.');
        }

        jsonResponse(false, null, 'Unknown action. Use register or login.', 400);
        break;

    case 'GET':
        if ($action === 'me') {
            $user = requireUserAuth($pdo);
            jsonResponse(true, ['user' => $user]);
        }
        jsonResponse(false, null, 'Unknown action. Use me.', 400);
        break;

    case 'DELETE':
        clearUserSession();
        jsonResponse(true, null, 'Logged out.');
        break;

    default:
        jsonResponse(false, null, 'Method not allowed.', 405);
}
