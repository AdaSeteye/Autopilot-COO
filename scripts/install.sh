#!/bin/bash

# Autopilot COO Installation Script
echo "🚀 Installing Autopilot COO - AI-Powered Business Operating System"
echo "================================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Create necessary directories
echo "📁 Creating project structure..."
mkdir -p frontend/components/ui
mkdir -p frontend/components/dashboard
mkdir -p frontend/lib
mkdir -p frontend/hooks
mkdir -p frontend/types
mkdir -p backend/src/{controllers,services,middleware,models,routes,utils,ai}
mkdir -p backend/tests
mkdir -p database
mkdir -p docs
mkdir -p scripts

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

# Create environment files
echo "🔧 Creating environment files..."

# Frontend .env.local
cat > ../frontend/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
EOF

# Backend .env
cat > .env << EOF
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
REDIS_URL=your_redis_url
FRONTEND_URL=http://localhost:3000
EOF

echo "✅ Environment files created"
echo ""
echo "🔧 Next steps:"
echo "1. Set up your Supabase project and update the environment variables"
echo "2. Get your OpenAI API key from https://platform.openai.com/"
echo "3. Set up Stripe for payments"
echo "4. Set up Resend for email (optional)"
echo "5. Run the database schema: psql -d your_database -f database/schema.sql"
echo ""
echo "🚀 To start development:"
echo "Frontend: cd frontend && npm run dev"
echo "Backend: cd backend && npm run dev"
echo ""
echo "📚 Documentation: See README.md for detailed setup instructions"
echo ""
echo "🎉 Installation complete! Happy coding!" 