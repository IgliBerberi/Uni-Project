# NovaShop — E-commerce (React + PHP + MySQL)

Offline e-commerce with XAMPP (MySQL + phpMyAdmin) and a local PHP API.

## Ports

| Service | URL |
|---------|-----|
| React app | **http://localhost:3000** |
| PHP API | **http://localhost:8080** (proxied as `/api` on port 3000) |
| phpMyAdmin | http://localhost/phpmyadmin |

## Quick start (two terminals)

### Terminal 1 — PHP backend

```bash
cd frontend
npm run backend
```

This serves `backend/` at `http://localhost:8080`. MySQL still comes from XAMPP — keep **MySQL** running in XAMPP.

### Terminal 2 — React frontend

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
    → Vite proxy /api/*
    → PHP server (localhost:8080/api/*.php)
    → MySQL (XAMPP, ecommerce_db)
```

Sessions use the `PHPSESSID` cookie. All API calls use `credentials: 'include'`.

## Troubleshooting

**404 on `/api/...`** — Start the backend: `npm run backend` in the `frontend` folder.

**Database connection failed** — Check XAMPP MySQL is running and `db_connect.php` credentials match phpMyAdmin.

**Test API directly** — With backend running, open:
`http://localhost:8080/api/auth/business.php?action=me` (should return JSON, not HTML 404).

## Routes

| URL | Description |
|-----|-------------|
| `/` | Storefront |
| `/account` | Customer login / register |
| `/business/login` | Business login / register |
| `/dashboard` | Products (business session required) |
