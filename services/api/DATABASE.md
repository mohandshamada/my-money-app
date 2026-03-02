# CashFlow Database Schema

Create the complete PostgreSQL database schema for CashFlow.

## Requirements

### Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  budget_type VARCHAR(50),
  notification_preferences JSONB,
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_connection_id UUID REFERENCES bank_connections(id),
  amount DECIMAL(12, 2) NOT NULL,
  is_expense BOOLEAN NOT NULL,
  merchant VARCHAR(255),
  description TEXT,
  date DATE NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags JSONB DEFAULT '[]',
  plaid_transaction_id VARCHAR(255),
  account_id VARCHAR(255),
  pending BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, plaid_transaction_id)
);
```

#### budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3),
  period_type VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE,
  rollover BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category, start_date)
);
```

#### bank_connections
```sql
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_access_token_encrypted TEXT NOT NULL,
  plaid_item_id VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255),
  institution_logo_url TEXT,
  last_synced_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending',
  sync_error_message TEXT,
  sync_error_count INTEGER DEFAULT 0,
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  UNIQUE(user_id, plaid_item_id)
);
```

#### bank_accounts
```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_account_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  account_type VARCHAR(50),
  account_subtype VARCHAR(50),
  current_balance DECIMAL(12, 2),
  available_balance DECIMAL(12, 2),
  is_hidden BOOLEAN DEFAULT FALSE,
  include_in_net_worth BOOLEAN DEFAULT TRUE,
  synced_at TIMESTAMP,
  UNIQUE(bank_connection_id, plaid_account_id)
);
```

#### forecasts
```sql
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  projected_balance DECIMAL(12, 2),
  confidence_level FLOAT,
  scenario_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, forecast_date, scenario_name)
);
```

#### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);
```

#### password_resets
```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
Create appropriate indexes for:
- users: email, created_at
- transactions: user_id, date, category, (user_id, date)
- budgets: user_id, start_date
- bank_connections: user_id, sync_status
- bank_accounts: user_id, bank_connection_id
- forecasts: user_id, forecast_date

## Output Files

1. Create `migrations/` folder with numbered SQL files
2. Create `seeds/` folder with sample data
3. Create `schema.sql` with complete schema
4. Create a Prisma schema as alternative: `prisma/schema.prisma`

## Commands to Run
```bash
cd /root/cashflow/services/api
mkdir -p migrations seeds prisma
```

Create ALL SQL migration files, Prisma schema, and seed data. Use UUID for all primary keys.
