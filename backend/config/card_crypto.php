<?php
/**
 * Demo-only encryption for stored card numbers. Never store CVV.
 * Use a proper vault (Stripe, etc.) in production.
 */
function cardEncryptionKey(): string
{
    return hash('sha256', 'novashop_demo_key_change_in_production', true);
}

function encryptCardNumber(string $plainNumber): string
{
    $key = cardEncryptionKey();
    $iv = random_bytes(16);
    $cipher = openssl_encrypt($plainNumber, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $cipher);
}

function decryptCardNumber(string $encrypted): string
{
    $raw = base64_decode($encrypted, true);
    if ($raw === false || strlen($raw) < 17) {
        return '';
    }
    $iv = substr($raw, 0, 16);
    $cipher = substr($raw, 16);
    $plain = openssl_decrypt($cipher, 'AES-256-CBC', cardEncryptionKey(), OPENSSL_RAW_DATA, $iv);
    return $plain !== false ? $plain : '';
}

function digitsOnly(string $value): string
{
    return preg_replace('/\D/', '', $value);
}

function detectCardBrand(string $number): string
{
    $d = digitsOnly($number);
    if ($d === '') {
        return 'card';
    }
    if ($d[0] === '4') {
        return 'visa';
    }
    if ($d[0] === '5') {
        return 'mastercard';
    }
    if ($d[0] === '3') {
        return 'amex';
    }
    return 'card';
}

function lastFourDigits(string $number): string
{
    $d = digitsOnly($number);
    return substr($d, -4);
}

function publicSavedCard(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'cardholder_name' => $row['cardholder_name'],
        'last_four' => $row['last_four'],
        'expiry_month' => $row['expiry_month'],
        'expiry_year' => $row['expiry_year'],
        'card_brand' => $row['card_brand'],
        'is_default' => (int) $row['is_default'],
        'label' => formatSavedCardLabel($row),
    ];
}

function formatSavedCardLabel(array $row): string
{
    $brand = ucfirst($row['card_brand'] ?? 'card');
    if ($brand === 'Card') {
        $brand = 'Card';
    }
    return "{$brand} •••• {$row['last_four']}";
}

function parseExpiry(string $expiry): ?array
{
    if (!preg_match('/^(\d{2})\/(\d{2})$/', $expiry, $m)) {
        return null;
    }
    return [
        'month' => $m[1],
        'year' => $m[2],
    ];
}
