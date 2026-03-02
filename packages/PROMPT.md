# CashFlow Shared Packages

Build the shared packages for CashFlow: types, utilities, and UI components.

## Package: @cashflow/types

Create TypeScript type definitions used across all apps.

### Types to Create
```typescript
// user.types.ts
interface User {
  id: string;
  email: string;
  fullName?: string;
  timezone: string;
  currency: string;
  budgetType: 'simple' | '50-30-20' | 'envelope' | 'custom';
  createdAt: Date;
}

// transaction.types.ts
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  isExpense: boolean;
  merchant?: string;
  description?: string;
  date: Date;
  category: string;
  subcategory?: string;
  tags: string[];
  pending: boolean;
  isRecurring: boolean;
}

// budget.types.ts
interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  rollover: boolean;
}

// forecast.types.ts
interface DailyForecast {
  date: string;
  projectedBalance: number;
  confidenceLow68: number;
  confidenceHigh68: number;
  confidenceLow95: number;
  confidenceHigh95: number;
}

// api.types.ts
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

## Package: @cashflow/shared

Create shared utilities.

### Utilities to Create
```typescript
// formatting.ts
formatCurrency(amount: number, currency: string): string
formatDate(date: Date): string
formatDateRelative(date: Date): string

// calculations.ts
calculateBudgetStatus(budget: Budget, spent: number): BudgetStatus
calculateNetWorth(assets: number, liabilities: number): number
calculateSavingsRate(income: number, savings: number): number

// validators.ts
isValidEmail(email: string): boolean
isValidPassword(password: string): boolean
isValidAmount(amount: string): boolean

// constants.ts
export const CATEGORIES = ['Food', 'Transport', 'Utilities', ...]
export const CURRENCIES = ['USD', 'EUR', 'GBP', ...]
export const BUDGET_TYPES = [...]
```

## Package: @cashflow/ui

Create shared UI components (for future React Native web).

### Components
```typescript
// Button.tsx
// Input.tsx
// Card.tsx
// Modal.tsx
// Loading.tsx
// Badge.tsx
// Progress.tsx
```

## File Structure
```
packages/
├── types/
│   ├── src/
│   │   ├── user.types.ts
│   │   ├── transaction.types.ts
│   │   ├── budget.types.ts
│   │   ├── forecast.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   ├── src/
│   │   ├── formatting.ts
│   │   ├── calculations.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── ui/
    ├── src/
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Card.tsx
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

## Commands to Run
```bash
# Create each package with TypeScript
cd /root/cashflow/packages/types
npm init -y
npm install -D typescript
npx tsc --init

cd /root/cashflow/packages/shared
npm init -y
npm install -D typescript
npx tsc --init

cd /root/cashflow/packages/ui
npm init -y
npm install react
npm install -D typescript @types/react
npx tsc --init
```

Build all three packages with proper TypeScript configuration and exports.
