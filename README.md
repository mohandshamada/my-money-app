# CashFlow - Personal Finance & Forecasting App

## 🚀 What's Been Built

### Backend API (`/services/api`)
- ✅ Node.js + Express + TypeScript
- ✅ Prisma ORM with PostgreSQL
- ✅ JWT Authentication (register, login, refresh, logout)
- ✅ Transaction CRUD + CSV import
- ✅ Budget management
- ✅ Cash flow forecasting (Monte Carlo simulation ready)
- ✅ Bank sync endpoints (Plaid-ready)
- ✅ Rate limiting, CORS, Helmet security
- ✅ Input validation with Zod

### Web Frontend (`/apps/web`)
- ✅ React + Vite + TypeScript
- ✅ TailwindCSS with dark mode
- ✅ Redux Toolkit state management
- ✅ React Router navigation
- ✅ Pages: Landing, Login, Register, Dashboard, Transactions, Budgets, Forecast
- ✅ Responsive design
- ✅ API integration ready

### Database Schema (`/services/api/prisma`)
- ✅ Users (auth, profile)
- ✅ Transactions (with Plaid support)
- ✅ Budgets (flexible periods)
- ✅ Bank Connections (Plaid tokens)
- ✅ Bank Accounts
- ✅ Forecasts (with scenarios)
- ✅ Refresh Tokens
- ✅ Password Resets

## 📁 Project Structure

```
cashflow/
├── apps/
│   ├── web/          # React web app (Vite + TS + Tailwind)
│   ├── ios/          # React Native iOS (TODO)
│   └── android/      # React Native Android (TODO)
├── packages/
│   ├── shared/       # Shared utilities (TODO)
│   ├── types/        # TypeScript types (TODO)
│   └── ui/           # Shared UI components (TODO)
├── services/
│   ├── api/          # Backend API (COMPLETE)
│   ├── bank-sync/    # Plaid service (TODO)
│   └── forecast/     # Monte Carlo engine (TODO)
└── docs/             # Documentation

```

## 🏃 Quick Start

### Backend

```bash
cd services/api
cp .env.example .env
# Edit .env with your database credentials
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

## 📱 Mobile Apps (Phase 2)

The mobile apps (iOS & Android) will use React Native with shared codebase:

- Same Redux store structure
- Shared API client
- Platform-specific navigation (React Navigation)
- Native performance with Expo or bare workflow

## 🎯 Next Steps

1. **Database Setup** - Run migrations and seed data
2. **API Testing** - Test all endpoints with the web frontend
3. **Mobile Apps** - Scaffold React Native projects
4. **Bank Sync** - Integrate Plaid for live bank connections
5. **Forecasting** - Implement Monte Carlo simulation
6. **Deploy** - Deploy to DigitalOcean/AWS

## 🔧 Environment Variables

Backend (`.env`):
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing key
- `PLAID_CLIENT_ID` - Plaid credentials
- `PLAID_SECRET` - Plaid credentials

Frontend (`.env`):
- `VITE_API_URL` - Backend URL

## 📄 License

MIT

---

*Built with 5 AI agents working in parallel (attempted 😅). Ended up building directly for reliability.*
