# 🚀 Production Setup Guide - Autopilot COO

This guide will help you deploy Autopilot COO to production with all the necessary configurations and optimizations.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] A Supabase account and project
- [ ] An OpenAI API key
- [ ] A Stripe account (for payments)
- [ ] A Resend account (for emails)
- [ ] A Redis instance (optional, for caching)

## 🔧 Environment Configuration

### 1. Frontend Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

### 2. Backend Environment Variables

Create `.env` in the `backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Configuration
RESEND_API_KEY=your_resend_api_key

# Redis Configuration (optional)
REDIS_URL=your_redis_url

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

## 🗄️ Database Setup

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the database schema from `database/schema.sql`
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers

### 2. Database Schema

Execute the SQL commands in `database/schema.sql` in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables, indexes, and RLS policies
-- (See database/schema.sql for complete schema)
```

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with the following settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Backend Deployment (Railway)

1. Connect your GitHub repository to Railway
2. Set the root directory to `backend`
3. Configure environment variables
4. Set the start command to `npm start`

### Option 2: Docker Deployment

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 🔒 Security Configuration

### 1. CORS Configuration

Update the CORS settings in `backend/src/index.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 2. Rate Limiting

The backend already includes rate limiting. Adjust the limits in `backend/src/index.js`:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
```

### 3. Environment Variables Security

- Never commit `.env` files to version control
- Use environment-specific files (`.env.production`, `.env.staging`)
- Rotate API keys regularly
- Use strong, unique passwords for all services

## 📊 Monitoring & Logging

### 1. Application Monitoring

Consider integrating with:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay
- [Google Analytics](https://analytics.google.com/) for user analytics

### 2. Performance Monitoring

- Set up [Vercel Analytics](https://vercel.com/analytics) for frontend
- Use [Railway Metrics](https://railway.app/docs/deploy/monitoring) for backend
- Monitor database performance in Supabase dashboard

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run type-check

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

## 🧪 Testing

### 1. Frontend Tests

```bash
npm run test
npm run test:coverage
```

### 2. Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

### 3. E2E Tests

Consider setting up Playwright or Cypress for end-to-end testing.

## 📈 Performance Optimization

### 1. Frontend Optimizations

- Images are optimized with Next.js Image component
- Code splitting is enabled
- Static generation for static pages
- Bundle analyzer for optimization

### 2. Backend Optimizations

- Database query optimization
- Redis caching for frequently accessed data
- Compression middleware enabled
- Rate limiting to prevent abuse

## 🔧 Maintenance

### 1. Regular Updates

- Keep dependencies updated
- Monitor security advisories
- Update Node.js version when needed
- Review and update API keys

### 2. Backup Strategy

- Supabase provides automatic backups
- Set up additional database backups if needed
- Backup environment variables securely

### 3. Monitoring Alerts

- Set up alerts for:
  - High error rates
  - Performance degradation
  - Disk space usage
  - API rate limit breaches

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify Node.js version
   - Clear cache and node_modules

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review RLS policies

3. **Authentication Problems**
   - Verify Supabase auth configuration
   - Check CORS settings
   - Review environment variables

### Support

For issues and questions:
- Check the [README.md](./README.md)
- Review [GitHub Issues](https://github.com/your-repo/issues)
- Contact support at support@autopilotcoo.com

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] CI/CD pipeline configured
- [ ] Documentation updated

---

🎉 Your Autopilot COO application is now ready for production!