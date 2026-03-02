# CashFlow - Personal Finance & Budget Forecasting App

## Project Structure
```
cashflow/
├── apps/
│   ├── web/          # React web app (Cursor CLI)
│   ├── ios/          # React Native iOS (Phase 2)
│   └── android/      # React Native Android (Phase 2)
├── packages/
│   ├── shared/       # Shared utilities
│   ├── types/        # TypeScript types
│   └── ui/           # Shared UI components
├── services/
│   ├── api/          # Node.js + Express backend (Claude Code)
│   ├── bank-sync/    # Plaid integration
│   └── forecast/     # Monte Carlo forecasting engine
├── infra/            # Infrastructure as code
└── docs/             # Documentation
```

## Tech Stack
- Backend: Node.js 18+ / Express / TypeScript / PostgreSQL / Redis
- Web: React 18 / Redux Toolkit / TailwindCSS / Recharts
- Mobile: React Native 0.72+ / React Navigation
- Auth: JWT + bcrypt
- Bank: Plaid API
- Payments: Stripe
- Infra: DigitalOcean or AWS

## Key Features
1. Transaction management (manual + CSV import)
2. Budget tracking (50/30/20, envelope, custom)
3. Cash flow forecasting (Monte Carlo simulation)
4. Bank sync (Plaid)
5. Multi-currency support

## Getting Started
See individual service/app READMEs for setup instructions.
