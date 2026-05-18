<?php

require_once __DIR__ . '/helpers.php';

function publicUserRow(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'full_name' => $row['full_name'],
        'email' => $row['email'],
        'created_at' => $row['created_at'] ?? null,
    ];
}

function publicBusinessRow(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'business_name' => $row['business_name'],
        'email' => $row['email'],
        'created_at' => $row['created_at'] ?? null,
    ];
}

function setUserSession(array $user): void
{
    $_SESSION['user'] = publicUserRow($user);
}

function setBusinessSession(array $business): void
{
    $_SESSION['business'] = publicBusinessRow($business);
}

function clearUserSession(): void
{
    unset($_SESSION['user']);
}

function clearBusinessSession(): void
{
    unset($_SESSION['business']);
}

function getUserSession(): ?array
{
    return $_SESSION['user'] ?? null;
}

function getBusinessSession(): ?array
{
    return $_SESSION['business'] ?? null;
}

function requireUserAuth(PDO $pdo): array
{
    $user = getUserSession();
    if (!$user) {
        jsonResponse(false, null, 'Please log in to continue.', 401);
    }

    $stmt = $pdo->prepare('SELECT id, full_name, email, created_at FROM users WHERE id = :id');
    $stmt->execute([':id' => $user['id']]);
    $row = $stmt->fetch();
    if (!$row) {
        clearUserSession();
        jsonResponse(false, null, 'User not found.', 401);
    }

    $fresh = publicUserRow($row);
    $_SESSION['user'] = $fresh;
    return $fresh;
}

function requireBusinessAuth(PDO $pdo): array
{
    $business = getBusinessSession();
    if (!$business) {
        jsonResponse(false, null, 'Business login required.', 401);
    }

    $stmt = $pdo->prepare('SELECT id, business_name, email, created_at FROM businesses WHERE id = :id');
    $stmt->execute([':id' => $business['id']]);
    $row = $stmt->fetch();
    if (!$row) {
        clearBusinessSession();
        jsonResponse(false, null, 'Business not found.', 401);
    }

    $fresh = publicBusinessRow($row);
    $_SESSION['business'] = $fresh;
    return $fresh;
}
