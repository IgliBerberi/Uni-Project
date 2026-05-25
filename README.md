# NovaShop — E-commerce (React + PHP + MySQL)

Offline e-commerce with XAMPP (MySQL + phpMyAdmin) and a local PHP API.

## Ports

| Service | URL |
|---------|-----|
| React app | **http://localhost:3000** |
| PHP API | **http://localhost/e-commerce/api/** (XAMPP Apache; proxied as `/api` on port 3000) |
| phpMyAdmin | http://localhost/phpmyadmin |

## Quick start

### 1 — Backend in XAMPP htdocs

1. Start **Apache** and **MySQL** in XAMPP.
2. Copy the entire `backend/` folder to **`C:\xampp\htdocs\e-commerce\`** (folder name must match `VITE_PROXY_TARGET` in `frontend/.env`).
3. Import `backend/sql/schema.sql` in phpMyAdmin; edit `htdocs/e-commerce/config/db_connect.php` if needed.

Test: open `http://localhost/e-commerce/api/auth/business.php?action=me` — you should get JSON, not a 404 page.

### 2 — React frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### Database (phpMyAdmin)

1. Start **MySQL** in XAMPP (Apache optional for phpMyAdmin only).
2. Import `backend/sql/schema.sql` (or `auth_tables.sql` if the DB already exists).
3. Edit `backend/config/db_connect.php` if needed (`root`, empty password).

## How it connects

```
Browser (localhost:3000)
    → Vite proxy /api/* and /uploads/*
    → XAMPP Apache (localhost/e-commerce/api/*.php)
    → MySQL (XAMPP, ecommerce_db)
```

**Without Apache** — from `frontend/`, run `npm run backend` (PHP on port 8080) and set `VITE_PROXY_TARGET=http://localhost:8080` in `.env`.

Sessions use the `PHPSESSID` cookie. All API calls use `credentials: 'include'`.

## Troubleshooting

**404 on `/api/...`** — Apache running? Is `backend/` copied to `htdocs/e-commerce/`? Does `.env` `VITE_PROXY_TARGET` match that folder name?

**Database connection failed** — Check XAMPP MySQL is running and `db_connect.php` credentials match phpMyAdmin.

**Test API directly** — With backend running, open:
`http://localhost/e-commerce/api/auth/business.php?action=me` (should return JSON, not HTML 404).

## Routes

| URL | Description |
|-----|-------------|
| `/` | Storefront |
| `/account` | Customer login / register |
| `/business/login` | Business login / register |
| `/dashboard` | Products (business session required) |
