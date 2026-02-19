# CashFlow API

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Setup environment
cp .env.example .env
# Edit .env with your values

# Run dev server
npm run dev
```

## API Documentation

### Authentication

#### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### POST /auth/login
Login existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

### Transactions

All transaction endpoints require authentication (Bearer token).

#### GET /api/transactions
List transactions with optional filters.

**Query Parameters:**
- `startDate` - ISO date string
- `endDate` - ISO date string
- `category` - Category name
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset

#### POST /api/transactions
Create new transaction.

**Request:**
```json
{
  "amount": 45.99,
  "isExpense": true,
  "merchant": "Starbucks",
  "category": "Food",
  "date": "2024-02-15T10:00:00Z"
}
```

### Budgets

#### GET /api/budgets
List all budgets with current status.

#### POST /api/budgets
Create new budget.

**Request:**
```json
{
  "category": "Groceries",
  "amount": 500,
  "periodType": "monthly",
  "startDate": "2024-02-01T00:00:00Z"
}
```

### Forecast

#### GET /api/forecast?days=30
Get cash flow forecast.

**Response:**
```json
{
  "forecast": [
    {
      "date": "2024-02-15",
      "projectedBalance": 5000,
      "confidenceLow68": 4800,
      "confidenceHigh68": 5200
    }
  ],
  "summary": {
    "currentBalance": 5000,
    "projectedBalance30d": 4800
  }
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | Secret for JWT signing | Yes |
| JWT_REFRESH_SECRET | Secret for refresh tokens | Yes |
| PLAID_CLIENT_ID | Plaid client ID | For bank sync |
| PLAID_SECRET | Plaid secret | For bank sync |
| REDIS_URL | Redis connection URL | Recommended |

## License
MIT
