# CashFlow Backend API

Build a production-ready Node.js + Express + TypeScript backend for CashFlow personal finance app.

## Requirements

### Core Setup
1. Initialize npm project with TypeScript
2. Set up Express with proper middleware (cors, helmet, rate limiting)
3. Configure PostgreSQL connection (use pg or Prisma)
4. Set up Redis for caching/sessions

### Authentication (Priority 1)
- JWT-based auth with refresh tokens
- bcrypt password hashing (12 rounds)
- Email/password registration
- Login with token generation
- Password reset flow
- 2FA support (optional, totp)

### Core Endpoints

#### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password

#### Transactions
- GET /api/transactions (list with pagination)
- POST /api/transactions
- PUT /api/transactions/:id
- DELETE /api/transactions/:id
- POST /api/transactions/import (CSV upload)

#### Budgets
- GET /api/budgets
- POST /api/budgets
- PUT /api/budgets/:id
- DELETE /api/budgets/:id

#### Forecast
- GET /api/forecast (30/90/365 day projections)
- POST /api/forecast/what-if

### Database Models
Create Prisma schema or TypeORM entities for:
- Users
- Transactions
- Budgets
- BankConnections
- BankAccounts
- Forecasts

### Security
- Input validation with Zod
- Rate limiting (100 req/15min per IP)
- CORS configuration
- Helmet security headers
- SQL injection prevention
- XSS protection

### File Structure
```
api/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── tests/
├── package.json
├── tsconfig.json
└── .env.example
```

## Commands to Run
```bash
cd /root/cashflow/services/api
npm init -y
npm install express cors helmet bcrypt jsonwebtoken zod dotenv
npm install -D typescript @types/node @types/express ts-node nodemon prisma
npx tsc --init
```

Build this COMPLETE backend with all endpoints working. Include proper error handling, validation, and database integration.
