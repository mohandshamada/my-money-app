# My Money - Personal Finance App

A full-featured personal finance application with AI capabilities.

## Features

- **Multi-Currency Support** - 50+ currencies with live exchange rates
- **AI Smart Categorizer** - Automatic transaction categorization using GLM-5
- **2FA/OTP Authentication** - TOTP-based two-factor authentication
- **Bill Calendar** - Monthly view of upcoming bills and income
- **Debt Payoff Calculator** - Snowball vs avalanche comparison
- **Savings Goals** - Track progress toward financial goals
- **Spending Streaks** - Gamification for saving habits
- **Safe-to-Spend** - Real-time available spending calculation
- **Subscription Manager** - Track and manage recurring charges
- **Mobile-Friendly** - Responsive design with bottom navigation

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + Prisma + PostgreSQL
- AI: GLM-5 (Zhipu AI)
- Deployment: Cloudflare Tunnel + systemd

## Setup

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Run development
npm run dev

# Build for production
npm run build
```

## Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
GLM5_API_KEY=your-api-key
```

## License

MIT