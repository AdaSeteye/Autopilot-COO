#!/bin/bash

# AutoPilot COO - Production Setup Script
# This script sets up the entire application for production use

set -e  # Exit on any error

echo "🚀 AutoPilot COO - Production Setup"
echo "===================================="
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "🔍 Checking prerequisites..."
check_command "node"
check_command "npm"
check_command "mysql"
check_command "git"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Get database configuration
echo "📊 Database Configuration"
echo "========================="
read -p "MySQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "MySQL Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -s -p "MySQL Password: " DB_PASSWORD
echo ""

read -p "Database Name (default: productivity_app): " DB_NAME
DB_NAME=${DB_NAME:-productivity_app}

# Test database connection
echo "🔌 Testing database connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to database. Please check your credentials."
    exit 1
fi

echo "✅ Database connection successful"

# Create database if it doesn't exist
echo "🗄️ Creating database if it doesn't exist..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# Generate JWT secret
echo "🔐 Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Get application configuration
echo ""
echo "🌐 Application Configuration"
echo "============================="
read -p "Frontend URL (e.g., https://app.yourdomain.com): " FRONTEND_URL
read -p "Backend URL (e.g., https://api.yourdomain.com): " BACKEND_URL
read -p "Backend Port (default: 3001): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
echo "==============================="

echo "Installing frontend dependencies..."
npm install --production

echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Create environment files
echo ""
echo "⚙️ Creating environment files..."
echo "=================================="

# Backend environment
cat > backend/.env << EOF
# Server Configuration
NODE_ENV=production
PORT=$BACKEND_PORT
FRONTEND_URL=$FRONTEND_URL

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Frontend environment
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$BACKEND_URL
NEXT_PUBLIC_APP_URL=$FRONTEND_URL
EOF

echo "✅ Environment files created"

# Build applications
echo ""
echo "🔨 Building applications..."
echo "==========================="

echo "Building frontend..."
npm run build

echo "✅ Applications built successfully"

# Create systemd service files (optional)
echo ""
read -p "Create systemd service files for auto-startup? (y/N): " CREATE_SERVICES
if [[ $CREATE_SERVICES =~ ^[Yy]$ ]]; then
    echo "📋 Creating systemd service files..."
    
    # Backend service
    sudo tee /etc/systemd/system/autopilot-coo-backend.service > /dev/null << EOF
[Unit]
Description=AutoPilot COO Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    sudo tee /etc/systemd/system/autopilot-coo-frontend.service > /dev/null << EOF
[Unit]
Description=AutoPilot COO Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable autopilot-coo-backend
    sudo systemctl enable autopilot-coo-frontend
    
    echo "✅ Systemd services created and enabled"
fi

# Create nginx configuration (optional)
echo ""
read -p "Create nginx configuration? (y/N): " CREATE_NGINX
if [[ $CREATE_NGINX =~ ^[Yy]$ ]]; then
    echo "🌐 Creating nginx configuration..."
    
    sudo tee /etc/nginx/sites-available/autopilot-coo << EOF
server {
    listen 80;
    server_name $(echo $FRONTEND_URL | sed 's|https\?://||');
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name $(echo $BACKEND_URL | sed 's|https\?://||');
    
    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/autopilot-coo /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "✅ Nginx configuration created"
fi

# Create startup script
echo ""
echo "📜 Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting AutoPilot COO..."

# Start backend
cd backend
nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

# Start frontend
cd ..
nohup npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid

echo "✅ AutoPilot COO started successfully"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Logs are available in the logs/ directory"
EOF

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping AutoPilot COO..."

# Stop backend
if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null
    rm logs/backend.pid
    echo "✅ Backend stopped"
fi

# Stop frontend
if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null
    rm logs/frontend.pid
    echo "✅ Frontend stopped"
fi

echo "✅ AutoPilot COO stopped successfully"
EOF

chmod +x start.sh stop.sh

# Create logs directory
mkdir -p logs

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your AutoPilot COO application has been set up successfully!"
echo ""
echo "📁 Configuration files created:"
echo "   - backend/.env (Backend configuration)"
echo "   - .env.local (Frontend configuration)"
echo ""
echo "🚀 To start the application:"
if [[ $CREATE_SERVICES =~ ^[Yy]$ ]]; then
    echo "   Using systemd services:"
    echo "   sudo systemctl start autopilot-coo-backend"
    echo "   sudo systemctl start autopilot-coo-frontend"
else
    echo "   Using startup script:"
    echo "   ./start.sh"
fi
echo ""
echo "🛑 To stop the application:"
if [[ $CREATE_SERVICES =~ ^[Yy]$ ]]; then
    echo "   sudo systemctl stop autopilot-coo-backend"
    echo "   sudo systemctl stop autopilot-coo-frontend"
else
    echo "   ./stop.sh"
fi
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend API: $BACKEND_URL"
echo "   Health Check: $BACKEND_URL/health"
echo ""
echo "📊 Database:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo ""
echo "📝 Next steps:"
echo "   1. Start the application using the commands above"
echo "   2. Create your first user account via the frontend"
echo "   3. Configure any additional settings as needed"
echo ""
echo "🆘 Support:"
echo "   - Documentation: README.md"
echo "   - Logs: logs/ directory"
echo "   - Issues: Create a GitHub issue"
echo ""
echo "Thank you for using AutoPilot COO! 🚀"