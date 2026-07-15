# Limpex Deployment Guide

## Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to h/railwayttps:/.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository (or upload project)

3. **Add PostgreSQL Database**
   - In Railway dashboard, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Note the connection variables

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=postgres.railway.internal
   DB_PORT=5432
   DB_NAME=railway
   DB_USER=postgres
   DB_PASSWORD=your-railway-db-password
   JWT_SECRET=your-random-64-char-string
   JWT_REFRESH_SECRET=your-random-64-char-string
   CORS_ORIGIN=https://yourdomain.vercel.app
   ```

5. **Deploy**
   - Railway auto-deploys on push
   - Note your backend URL: `https://xxx.up.railway.app`

6. **Run Migrations**
   - In Railway terminal:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

---

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`

3. **Configure Build Settings**
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://xxx.up.railway.app/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Note your frontend URL: `https://xxx.vercel.app`

---

### Step 3: Connect Domain

1. **In Vercel Dashboard**
   - Go to your project → Settings → Domains
   - Add your GoDaddy domain

2. **Update GoDaddy DNS**
   - Login to GoDaddy → My Products → Domains → DNS
   - Add these records:

   | Type | Name | Value |
   |------|------|-------|
   | A | @ | 76.76.21.21 |
   | CNAME | www | cname.vercel-dns.com |

3. **Update Railway CORS**
   - Update CORS_ORIGIN to your custom domain

---

## Option 2: Render (Backend)

### Deploy Backend to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect GitHub repository

3. **Configure**
   - Name: limpex-api
   - Region: Singapore (closest)
   - Branch: main
   - Root Directory: backend
   - Build Command: `npm install`
   - Start Command: `node server.js`

4. **Add Database**
   - Click "New" → "PostgreSQL"
   - Note connection details

5. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=your-render-db-host
   DB_PORT=5432
   DB_NAME=limpex
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   JWT_SECRET=your-random-secret
   JWT_REFRESH_SECRET=your-random-secret
   CORS_ORIGIN=https://yourdomain.com
   ```

6. **Deploy & Run Migrations**

---

## Option 3: Netlify (Frontend)

### Deploy Frontend to Netlify

1. **Create Netlify Account**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **New Site**
   - Click "New site from Git"
   - Select repository
   - Base directory: frontend
   - Build command: npm run build
   - Publish directory: build

3. **Set Environment**
   - Site settings → Environment variables
   - Add: REACT_APP_API_URL=https://your-backend-url/api

---

## Environment Variables Template

Create `.env.production` in frontend:
```
REACT_APP_API_URL=https://your-backend-url.up.railway.app/api
```

Create `.env` in backend:
```env
PORT=5000
NODE_ENV=production

# Database (Railway provides these automatically)
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your-password

# JWT Secrets (generate random strings)
JWT_SECRET=abc123...64chars
JWT_REFRESH_SECRET=xyz789...64chars

# CORS
CORS_ORIGIN=https://yourdomain.vercel.app

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Quick Deploy Commands

### Railway Backend
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add database
railway add postgresql

# Deploy
railway up
```

### Vercel Frontend
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Post-Deployment Checklist

| Task | URL/Status |
|------|------------|
| Backend deployed | https://xxx.up.railway.app |
| Frontend deployed | https://xxx.vercel.app |
| Database connected | ✅ |
| Domain added | ✅ |
| SSL working | ✅ |
| Admin login works | ✅ |

---

## Default Admin Credentials

```
Email: admin@limpex.com
Password: Admin@123
```

**Change this password after first login!**
