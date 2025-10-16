#!/bin/bash

echo "================================================"
echo "  Kleara Clinic - Vercel Deployment Script"
echo "================================================"
echo ""

# Check if Vercel CLI is installed
echo "📦 Checking Vercel CLI..."
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "================================================"
echo "  Choose Deployment Option:"
echo "================================================"
echo "1. Deploy Server (Backend)"
echo "2. Deploy Client (Frontend)"
echo "3. Deploy Both (Server + Client)"
echo "4. Exit"
echo ""

read -p "Enter your choice (1-4): " choice

deploy_server() {
    echo ""
    echo "🚀 Deploying Server..."
    cd server
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Server deployed successfully!"
    cd ..
}

deploy_client() {
    echo ""
    echo "🚀 Deploying Client..."
    cd client
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🏗️  Building client..."
    npm run build
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Client deployed successfully!"
    cd ..
}

case $choice in
    1)
        deploy_server
        ;;
    2)
        deploy_client
        ;;
    3)
        deploy_server
        deploy_client
        ;;
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "  ✅ Deployment Complete!"
echo "================================================"
echo ""
echo "📝 Next Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Configure Environment Variables"
echo "3. Test your deployments"
echo ""
echo "📚 Documentation: VERCEL_DEPLOYMENT.md"
echo ""
