# Limpex - Customs Brokerage Solutions

A professional website for Limpex Customs Brokerage with a modern landing page and secure admin dashboard.

## Features

- **Professional Landing Page** - Matching the GoDaddy Limpex design
- **Admin Dashboard** - Analytics, user management, audit logs
- **Product Management** - Indian & International products
- **Role-Based Access** - Super Admin, Admin, Editor, User
- **Security** - JWT auth, rate limiting, CORS, helmet

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
cd E:\Projects\Website

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Setup Database

```bash
cd backend

# Create tables
npm run migrate

# Create admin user
npm run seed

# Import products (optional)
npm run import-products
```

### Run Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Default Login
- **Email:** admin@limpex.com
- **Password:** Admin@123

## Website Structure

### Public Pages
- `/` - Landing page (Limpex design)
- `/login` - Admin login
- `/register` - Create account

### Admin Dashboard (`/admin`)
- `/admin/dashboard` - Analytics overview
- `/admin/products` - Product management
- `/admin/users` - User management
- `/admin/audit` - Audit logs
- `/admin/analytics` - Request analytics

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React.js |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |

## Deployment

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## Contact

- **Phone:** +91.9892199247
- **Email:** info@limpex.com
