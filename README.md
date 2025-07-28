# AutoPilot COO - AI-Powered Business Operating System

A comprehensive productivity and business management platform powered by AI that helps streamline operations, track objectives and key results (OKRs), manage tasks, handle invoicing, and provide intelligent insights.

## 🚀 Features

### ✅ Task Management
- Create, update, and track tasks with priority levels
- Due date management and overdue alerts
- Status tracking (pending, in progress, completed)
- Task statistics and productivity metrics

### 🎯 OKR Management
- Create and manage Objectives and Key Results
- Track progress with visual indicators
- Period-based goal setting (quarterly, semi-annual, annual)
- Key result completion analytics

### 💼 Invoice Management
- Create professional invoices with multiple line items
- Client management system
- Multiple currency support (USD, EUR, GBP, CAD, AUD)
- Invoice status tracking (draft, sent, paid, overdue, cancelled)
- Financial reporting and analytics

### 🤖 AI-Powered Features
- AI task generation based on prompts
- Smart OKR suggestions
- Content generation (emails, reports, proposals, summaries)
- Task prioritization algorithms
- Productivity insights and recommendations

### 📊 Analytics & Reporting
- Comprehensive dashboard with real-time metrics
- Productivity tracking and trends
- Financial performance analytics
- Goal progress visualization
- Data export functionality (JSON/CSV)

### 👥 User Management
- Secure authentication with JWT
- User profile management
- Client relationship management
- Activity logging and audit trails

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + Radix UI components
- **State Management**: React hooks and context
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript support
- **Database**: MySQL with connection pooling
- **Authentication**: JWT-based auth system
- **Validation**: Express Validator
- **Logging**: Winston with file rotation
- **Security**: Helmet, CORS, rate limiting

### Database Schema
- **Users**: Authentication and profile data
- **Tasks**: Task management with priority and status
- **OKRs**: Objectives with linked key results
- **Invoices**: Complete invoicing system with items
- **Clients**: Customer relationship management

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd autopilot-coo
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Create environment file
cp .env.example .env.local

# Configure environment variables
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Backend Setup
```bash
# Navigate to backend
cd backend

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=productivity_app
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE productivity_app;
exit

# The database tables will be created automatically on first run
```

### 5. Run Development Servers
```bash
# Terminal 1: Frontend (from project root)
npm run dev

# Terminal 2: Backend (from backend directory)
cd backend
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 🚀 Production Deployment

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

#### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app-domain.com

# Database
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=productivity_app

# Security
JWT_SECRET=your-super-secret-production-jwt-key-64-chars-minimum

# Logging
LOG_LEVEL=info
```

### Build Commands
```bash
# Build frontend
npm run build

# Build backend (if using TypeScript compilation)
cd backend
npm run build

# Start production servers
npm start  # Frontend
cd backend && npm start  # Backend
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Task Management
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats/summary` - Task statistics

### OKR Management
- `GET /api/okrs` - List OKRs
- `POST /api/okrs` - Create new OKR
- `GET /api/okrs/:id` - Get specific OKR
- `PUT /api/okrs/:id` - Update OKR
- `PUT /api/okrs/:okrId/key-results/:krId` - Update key result progress
- `DELETE /api/okrs/:id` - Delete OKR

### Invoice Management
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get specific invoice
- `PATCH /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### AI Features
- `POST /api/ai/generate-tasks` - Generate AI tasks
- `POST /api/ai/suggest-okrs` - Get AI OKR suggestions
- `POST /api/ai/generate-content` - Generate AI content
- `GET /api/ai/insights` - Get AI insights
- `POST /api/ai/prioritize-tasks` - AI task prioritization

### Analytics
- `GET /api/metrics/dashboard` - Dashboard metrics
- `GET /api/metrics/productivity` - Productivity analytics
- `GET /api/metrics/financial` - Financial metrics
- `GET /api/metrics/goals` - Goal progress metrics
- `GET /api/metrics/export` - Data export

## 🔒 Security Features

- **Authentication**: JWT-based with secure token handling
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Protection**: Parameterized queries
- **CORS Protection**: Configured CORS for cross-origin requests
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: bcrypt for secure password storage

## 📈 Performance Optimizations

- **Database Indexing**: Optimized database indexes for common queries
- **Connection Pooling**: MySQL connection pooling for better performance
- **Compression**: Gzip compression for API responses
- **Caching**: Strategic caching for static data
- **Code Splitting**: Next.js automatic code splitting

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test

# Linting
npm run lint

# Type checking
npm run type-check
```

## 📦 Project Structure

```
autopilot-coo/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── dashboard/         # Dashboard-specific components
├── lib/                   # Utility libraries
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   └── logs/              # Application logs
├── database/              # Database schemas and migrations
└── public/                # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@autopilotcoo.com or join our Slack channel.

## 🗺️ Roadmap

- [ ] Real-time notifications
- [ ] Mobile app development
- [ ] Advanced AI integrations
- [ ] Team collaboration features
- [ ] Calendar integration
- [ ] Email automation
- [ ] Advanced reporting dashboards
- [ ] Multi-language support

---

Built with ❤️ by the AutoPilot COO Team 