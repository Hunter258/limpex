# Cloudflare Setup Guide for Limpex

## Step 1: Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for free (Free plan is sufficient)
3. Add your domain

## Step 2: Update DNS Records
In Cloudflare Dashboard > DNS > Records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | `limpex-production.up.railway.app` | Proxied (orange cloud) |
| CNAME | www | `limpex-production.up.railway.app` | Proxied (orange cloud) |

## Step 3: SSL/TLS Settings
Go to SSL/TLS > Overview:
- Set SSL mode to **Full (Strict)**
- Enable **Always Use HTTPS**
- Enable **Automatic HTTPS Rewrites**

## Step 4: Caching Rules
Go to Caching > Configuration:
- Browser Cache TTL: **1 month**
- Caching Level: **Standard**

Go to Caching > Cache Rules > Create Rule:
- Rule name: `Static Assets`
- When: `File extension equals css, js, png, jpg, jpeg, gif, svg, ico, woff, woff2, ttf`
- Then: Edge Cache TTL = **1 month**, Browser Cache TTL = **1 year**

## Step 5: Performance Settings
Go to Speed > Optimization:
- Enable **Auto Minify** (JS, CSS, HTML)
- Enable **Brotli** compression
- Enable **Early Hints**

Go to Speed > Content Optimization:
- Enable **Rocket Loader** (optional - test first)
- Enable **Polish** (Lossy)

## Step 6: Security
Go to Security > Settings:
- Security Level: **Medium**
- Enable **Browser Integrity Check**
- Enable **Under Attack Mode** only during DDoS (normally leave off)

Go to Security > WAF:
- Free plan includes basic WAF rules automatically

## Step 7: Page Rules (Free plan: 3 rules)
Go to Configuration Rules > Rules:

Rule 1: `*railway.app/api/*`
- Cache Level: Bypass
- Browser Integrity Check: On

Rule 2: `*railway.app/admin/*`
- Cache Level: Bypass
- Security Level: High

Rule 3: `*railway.app/*.js`
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month

## Step 8: Update Railway Environment
Add to Railway environment variables:
```
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com,https://limpex-production.up.railway.app
FRONTEND_URL=https://yourdomain.com
```

## Step 9: Nameserver Update
Go to your domain registrar (GoDaddy/Namecheap/etc):
- Change nameservers to the ones Cloudflare provides
- Wait 24-48 hours for propagation

## Step 10: Verify
1. Visit your domain - should load via Cloudflare
2. Check SSL certificate is valid (padlock icon)
3. Test all functionality (login, cart, checkout)
4. Run Lighthouse audit

## What This Gives You
- **Free SSL certificate** (auto-renewing)
- **DDoS protection** (Cloudflare absorbs attacks)
- **WAF** (Web Application Firewall) 
- **Global CDN** (assets cached worldwide)
- **Faster page loads** (minification, compression, caching)
- **Bot protection** (browser integrity check)
