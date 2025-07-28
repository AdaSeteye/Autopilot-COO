#!/bin/bash

# Autopilot COO Deployment Script
set -e

echo "🚀 Starting Autopilot COO deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create logs directory
mkdir -p logs

# Build backend
echo "🔨 Building backend..."
npm run build

cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads

# Set proper permissions
echo "🔐 Setting permissions..."
chmod +x scripts/deploy.sh
chmod +x scripts/start.sh

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables in .env.local and backend/.env"
echo "2. Set up your Supabase database using database/schema.sql"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Run 'cd backend && npm run dev' to start the backend server"