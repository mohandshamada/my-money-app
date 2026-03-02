# CashFlow Web Frontend

Build a production-ready React web app for CashFlow personal finance app.

## Requirements

### Core Setup
1. Initialize with Vite + React + TypeScript
2. Set up TailwindCSS for styling
3. Configure Redux Toolkit for state management
4. Set up React Router for navigation
5. Configure Axios + React Query for API calls

### Pages
1. **Landing Page** (`/`) - Marketing, features, pricing
2. **Auth Pages**
   - Login (`/login`)
   - Register (`/register`)
   - Forgot Password (`/forgot-password`)
3. **Dashboard** (`/dashboard`) - Main overview
4. **Transactions** (`/transactions`) - List, add, import
5. **Budgets** (`/budgets`) - Budget management
6. **Forecast** (`/forecast`) - Calendar view + charts
7. **Settings** (`/settings`) - Account settings

### Components

#### Dashboard
- BalanceCard - Current balance display
- QuickStats - Income/expense summary
- RecentTransactions - Last 10 transactions
- BudgetOverview - Budget status cards
- ForecastChart - 30-day projection line chart

#### Transactions
- TransactionList - Paginated table
- TransactionForm - Add/edit transaction
- TransactionImport - CSV upload with mapping
- CategorySelect - Category dropdown

#### Budgets
- BudgetList - All budgets overview
- BudgetForm - Create/edit budget
- BudgetStatus - Progress bar with status
- BudgetTypeSelector - 50/30/20, envelope, custom

#### Forecast
- ForecastChart - Line chart with confidence intervals
- ForecastCalendar - Calendar view with daily balances
- WhatIfScenario - Scenario testing form

### State Management (Redux)
```typescript
// slices
- authSlice (user, token, isAuthenticated)
- transactionSlice (transactions, filters)
- budgetSlice (budgets, status)
- forecastSlice (projections, scenarios)
- uiSlice (modals, notifications)
```

### Styling
- TailwindCSS with custom theme
- Dark mode support
- Responsive design (mobile-first)
- Color scheme:
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Danger: Red (#EF4444)

### File Structure
```
web/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Transactions/
│   │   ├── Budgets/
│   │   ├── Forecast/
│   │   └── Common/
│   ├── pages/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Commands to Run
```bash
cd /root/cashflow/apps/web
npm create vite@latest . -- --template react-ts
npm install redux @reduxjs/toolkit react-router-dom axios react-query
npm install tailwindcss postcss autoprefixer recharts lucide-react
npm install react-hook-form zod
npx tailwindcss init -p
```

Build this COMPLETE web app with all pages and components working. Focus on clean UI, good UX, and proper state management.
