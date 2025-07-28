# 🚀 Deployment Guide - Autopilot COO

This guide covers deploying the AI-powered business operating system to production environments.

## 📋 Prerequisites

Before deployment, ensure you have:

- [ ] Supabase project set up
- [ ] OpenAI API key
- [ ] Stripe account for payments
- [ ] Resend account for emails (optional)
- [ ] Domain name (optional)
- [ ] SSL certificates

## 🏗️ Infrastructure Setup

### 1. Supabase Setup

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com
   # Create new project
   # Note down your project URL and API keys
   ```

2. **Run Database Schema**
   ```bash
   # Connect to your Supabase database
   psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   
   # Run the schema
   \i database/schema.sql
   ```

3. **Configure Row Level Security**
   - Enable RLS on all tables
   - Set up policies for user data isolation

### 2. Environment Configuration

#### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Backend Environment (.env)
```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
REDIS_URL=redis://...
FRONTEND_URL=https://your-frontend-domain.com
```

## 🚀 Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend Deployment (Vercel)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   cd frontend
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Add all environment variables from `.env.local`

3. **Custom Domain (Optional)**
   - Add custom domain in Vercel settings
   - Configure DNS records

#### Backend Deployment (Railway)

1. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   cd backend
   railway login
   railway up
   ```

2. **Configure Environment Variables**
   - Add all environment variables in Railway dashboard

3. **Custom Domain**
   - Add custom domain in Railway settings

### Option 2: Docker Deployment

#### Docker Compose Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
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

### Option 3: AWS Deployment

#### Using AWS ECS

1. **Create ECS Cluster**
2. **Deploy Frontend to ECS**
3. **Deploy Backend to ECS**
4. **Set up Application Load Balancer**
5. **Configure Auto Scaling**

## 🔧 Production Configuration

### 1. Security Headers

Add security headers in `next.config.js`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### 2. Rate Limiting

Configure rate limiting in backend:
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

app.use('/api/', limiter)
```

### 3. CORS Configuration

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 4. SSL/TLS

- Use Let's Encrypt for free SSL certificates
- Configure automatic renewal
- Force HTTPS redirects

## 📊 Monitoring & Logging

### 1. Application Monitoring

#### Frontend (Vercel Analytics)
```javascript
// Add to _app.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

#### Backend (Winston)
```javascript
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### 2. Error Tracking

#### Sentry Integration
```javascript
// Frontend
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

// Backend
const Sentry = require('@sentry/node')

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

## 🧪 Testing

### 1. Unit Tests
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test
```

### 2. Integration Tests
```bash
# Run API tests
cd backend && npm run test:integration
```

### 3. E2E Tests
```bash
# Run Playwright tests
npm run test:e2e
```

## 📈 Performance Optimization

### 1. Frontend Optimization

- Enable Next.js Image Optimization
- Implement code splitting
- Use React.memo for expensive components
- Optimize bundle size

### 2. Backend Optimization

- Implement caching with Redis
- Use database connection pooling
- Optimize database queries
- Implement request compression

### 3. Database Optimization

- Create proper indexes
- Monitor query performance
- Implement read replicas for scaling

## 🔒 Security Checklist

- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF protection
- [ ] Security headers set
- [ ] Regular security updates

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration
   - Verify frontend URL in backend settings

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity

3. **AI Service Errors**
   - Verify OpenAI API key
   - Check API rate limits

4. **Payment Issues**
   - Verify Stripe configuration
   - Check webhook endpoints

## 📞 Support

For deployment issues:
- Check logs in Vercel/Railway dashboards
- Review application monitoring
- Contact support with error details

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Update dependencies

2. **Monthly**
   - Security updates
   - Database maintenance
   - Backup verification

3. **Quarterly**
   - Full security audit
   - Performance optimization
   - Feature updates

---

**Happy Deploying! 🚀** 