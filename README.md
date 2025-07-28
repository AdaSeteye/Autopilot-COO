# 🧠 Autopilot COO - AI-Powered Business Operating System

> **An AI-powered dashboard that acts as a business operating system for solo founders or small teams — helping them plan, track, automate, and act intelligently.**

## 🚀 Features

### 🏠 Smart Dashboard
- **AI-Generated Business Summary**: Daily insights and metrics overview
- **Intelligent Task Planning**: AI suggests top 3 tasks for today
- **OKR Tracking**: SMART goal generation and progress monitoring
- **Real-time Metrics**: Revenue, churn, and key performance indicators

### 🤖 AI-Powered Automation
- **Weekly Business Reviews**: Automated GPT-generated summaries
- **Smart Suggestions**: Proactive insights and recommendations
- **Invoice Generation**: AI-assisted invoice creation and management
- **Recurring Task Automation**: Natural language task scheduling

### 📊 Business Intelligence
- **Goal Management**: Link tasks to OKRs with automatic scoring
- **Performance Analytics**: Track progress across all business areas
- **Predictive Insights**: AI-powered trend analysis and forecasting

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations

### Backend
- **Node.js/Express** for API
- **Supabase** for auth and database
- **OpenAI GPT-4** for AI features
- **LangChain** for AI orchestration
- **Stripe** for payments
- **Resend** for email

### Infrastructure
- **PostgreSQL** via Supabase
- **Redis** for caching and queues
- **Vercel** for frontend deployment
- **Railway** for backend deployment

## 📁 Project Structure

```
autopilot-coo/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utilities and configurations
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── ai/             # AI/ML services
│   └── tests/              # Backend tests
├── docs/                   # Documentation
└── scripts/                # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Supabase account
- Stripe account

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Environment Variables

Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

Create `.env` in the backend directory:
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
RESEND_API_KEY=your_resend_key
REDIS_URL=your_redis_url
```

## 🧠 AI Features

### Daily Task Planning
- Analyzes user's tasks, OKRs, and deadlines
- Suggests top 3 priority tasks for the day
- Learns from user's completion patterns

### Weekly Business Reviews
- Automatically generates weekly summaries
- Highlights key metrics and trends
- Provides actionable insights

### Smart Suggestions
- Proactive recommendations based on business data
- Churn alerts and customer engagement suggestions
- Goal completion strategies

### Invoice Assistant
- AI-generated invoice descriptions
- Smart pricing suggestions
- Automated follow-up reminders

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `tasks` - Task management with AI metadata
- `okrs` - Objectives and Key Results
- `invoices` - Invoice management
- `metrics` - Business metrics tracking
- `ai_suggestions` - AI-generated insights
- `recurring_tasks` - Automated task scheduling

## 🔒 Security Features

- JWT-based authentication
- Rate limiting and brute force protection
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- SQL injection prevention

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Backend Tests
```bash
cd backend
npm test
```

## 📈 Performance

- Server-side rendering for SEO
- Image optimization
- Code splitting
- Redis caching
- Database query optimization
- CDN for static assets

## 🚀 Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Railway)
```bash
railway up
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, email support@autopilotcoo.com or join our Discord community.

---

Built with ❤️ for solo founders and small teams 