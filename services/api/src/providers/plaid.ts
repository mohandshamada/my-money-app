// Plaid Provider Implementation
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

export const plaidProvider = {
  name: 'Plaid',
  logo: 'https://plaid.com/assets/img/logo.png',
  regions: ['US', 'CA', 'GB', 'IE', 'FR', 'ES', 'NL', 'DE'] as string[],
  features: ['accounts', 'transactions', 'balance', 'identity', 'auth'],
  supportsRealtimeBalance: true,

  isAvailable(): boolean {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const hasRealCredentials = !!(clientId && secret && 
              !clientId.includes('your_') && 
              !secret.includes('your_'));
    
    // Demo mode - show Plaid UI even without credentials
    const demoMode = process.env.BANK_DEMO_MODE === 'true';
    
    return hasRealCredentials || demoMode;
  },

  async createLinkToken(userId: string, redirectUri?: string): Promise<string> {
    // Demo mode - return mock token
    if (process.env.BANK_DEMO_MODE === 'true' && !process.env.PLAID_CLIENT_ID?.includes('test_')) {
      return `demo-link-token-${userId}-${Date.now()}`;
    }
    
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'My Money',
      products: [Products.Transactions, Products.Auth, Products.Identity],
      country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb, CountryCode.Ie, CountryCode.Fr, CountryCode.Es, CountryCode.Nl, CountryCode.De],
      language: 'en',
      webhook: `${process.env.API_URL}/api/bank/webhook/plaid`,
      redirect_uri: redirectUri,
    });

    return response.data.link_token;
  },

  async exchangeToken(userId: string, publicToken: string, metadata: any) {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
      refreshToken: null, // Plaid doesn't use refresh tokens
    };
  },

  async getAccounts(accessToken: string) {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    return response.data.accounts.map((acc: any) => ({
      id: acc.account_id,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      mask: acc.mask,
      balance: {
        current: acc.balances.current,
        available: acc.balances.available,
      },
      currency: acc.balances.iso_currency_code || 'USD',
    }));
  },

  async getBalances(accessToken: string) {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });

    return response.data.accounts.map((acc: any) => ({
      accountId: acc.account_id,
      current: acc.balances.current,
      available: acc.balances.available,
      currency: acc.balances.iso_currency_code,
    }));
  },

  async getTransactions(accessToken: string, startDate: Date, endDate: Date) {
    const transactions = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        options: {
          offset,
          count: 500,
        },
      });

      transactions.push(...response.data.transactions.map((txn: any) => ({
        id: txn.transaction_id,
        accountId: txn.account_id,
        amount: txn.amount,
        description: txn.name,
        merchant: txn.merchant_name,
        date: txn.date,
        category: txn.personal_finance_category?.primary || 'other',
        pending: txn.pending,
        currency: txn.iso_currency_code,
      })));

      hasMore = transactions.length < response.data.total_transactions;
      offset += response.data.transactions.length;
    }

    return transactions;
  },

  async revokeAccess(accessToken: string) {
    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (e) {
      console.error('Failed to revoke Plaid access:', e);
    }
  },

  async handleWebhook(payload: any) {
    const { webhook_type, webhook_code, item_id } = payload;

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'INITIAL_UPDATE') {
      return { itemId: item_id, type: 'transactions_ready' };
    }

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'HISTORICAL_UPDATE') {
      return { itemId: item_id, type: 'historical_ready' };
    }

    return { itemId: item_id };
  },
};
