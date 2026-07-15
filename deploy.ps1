# Deploy Limpex to Vercel + Railway
# Run this script from project root

echo "=== Limpex Deployment Script ==="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo ""
echo "Step 1: Deploy Backend to Railway"
echo "--------------------------------"
cd backend
railway login
railway init
railway add postgresql
railway up
echo ""
echo "Backend deployed! Note your URL above."
echo ""

echo "Step 2: Deploy Frontend to Vercel"
echo "---------------------------------"
cd ../frontend
vercel login
vercel --prod
echo ""
echo "Frontend deployed! Note your URL above."
echo ""

echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Add your GoDaddy domain in Vercel settings"
echo "2. Update GoDaddy DNS to point to Vercel"
echo "3. Update CORS_ORIGIN in Railway with your domain"
echo ""
