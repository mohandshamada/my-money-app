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
  logo: 'https://cdn.plaid.com/link/v2/stable/images/plaid.svg',
  regions: ['US', 'CA', 'GB', 'IE', 'FR', 'ES', 'NL', 'DE'] as string[],
  features: ['accounts', 'transactions', 'balance', 'identity', 'auth'],
  supportsRealtimeBalance: true,

  isAvailable(): boolean {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    
    // Check if we have real credentials (not placeholders)
    const hasRealCredentials = !!(clientId && secret && 
              clientId.length > 20 && 
              secret.length > 20 &&
              !clientId.includes('your_') && 
              !secret.includes('your_') &&
              !clientId.includes('test_') &&
              !secret.includes('test_'));
    
    // Demo mode - show Plaid UI even without credentials
    const demoMode = process.env.BANK_DEMO_MODE === 'true';
    
    console.log('Plaid availability check:', { 
      hasRealCredentials, 
      demoMode,
      clientIdExists: !!clientId,
      secretExists: !!secret 
    });
    
    return hasRealCredentials || demoMode;
  },

  hasRealCredentials(): boolean {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    
    return !!(clientId && secret && 
              clientId.length > 20 && 
              secret.length > 20 &&
              !clientId.includes('your_') && 
              !secret.includes('your_') &&
              !clientId.includes('test_') &&
              !secret.includes('test_'));
  },

  async createLinkToken(userId: string, redirectUri?: string): Promise<string> {
    // Check if we're in demo mode without real credentials
    if (!this.hasRealCredentials()) {
      console.log('Returning demo link token for user:', userId);
      return `demo-link-token-${userId}-${Date.now()}`;
    }
    
    console.log('Creating real Plaid link token for user:', userId);
    
    try {
      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'My Money',
        products: [Products.Transactions, Products.Auth, Products.Identity],
        country_codes: [
          CountryCode.Us, 
          CountryCode.Ca, 
          CountryCode.Gb, 
          CountryCode.Ie, 
          CountryCode.Fr, 
          CountryCode.Es, 
          CountryCode.Nl, 
          CountryCode.De
        ],
        language: 'en',
        webhook: process.env.API_URL ? `${process.env.API_URL}/api/bank/webhook/plaid` : undefined,
        redirect_uri: redirectUri,
      });

      console.log('Plaid link token created successfully');
      return response.data.link_token;
    } catch (error) {
      console.error('Failed to create Plaid link token:', error);
      throw error;
    }
  },

  async exchangeToken(userId: string, publicToken: string, metadata: any) {
    // Handle demo tokens
    if (publicToken.startsWith('demo-')) {
      console.log('Processing demo token exchange');
      return {
        accessToken: `demo-access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: `demo-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        refreshToken: null,
      };
    }

    console.log('Exchanging real Plaid public token');
    
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      console.log('Plaid token exchange successful');
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
        refreshToken: null, // Plaid doesn't use refresh tokens
      };
    } catch (error) {
      console.error('Failed to exchange Plaid token:', error);
      throw error;
    }
  },

  async getAccounts(accessToken: string) {
    // Handle demo access tokens
    if (accessToken.startsWith('demo-')) {
      console.log('Returning demo accounts');
      return [
        {
          id: 'demo-checking-001',
          name: 'Demo Checking',
          type: 'depository',
          subtype: 'checking',
          mask: '0001',
          balance: {
            current: 5423.50,
            available: 5223.50,
          },
          currency: 'USD',
        },
        {
          id: 'demo-savings-001',
          name: 'Demo Savings',
          type: 'depository',
          subtype: 'savings',
          mask: '0002',
          balance: {
            current: 12750.00,
            available: 12750.00,
          },
          currency: 'USD',
        },
        {
          id: 'demo-credit-001',
          name: 'Demo Credit Card',
          type: 'credit',
          subtype: 'credit card',
          mask: '0003',
          balance: {
            current: -1245.67,
            available: 3754.33,
          },
          currency: 'USD',
        },
      ];
    }

    console.log('Fetching real Plaid accounts');
    
    try {
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
    } catch (error) {
      console.error('Failed to fetch Plaid accounts:', error);
      throw error;
    }
  },

  async getBalances(accessToken: string) {
    // Handle demo access tokens
    if (accessToken.startsWith('demo-')) {
      return [
        { accountId: 'demo-checking-001', current: 5423.50, available: 5223.50, currency: 'USD' },
        { accountId: 'demo-savings-001', current: 12750.00, available: 12750.00, currency: 'USD' },
        { accountId: 'demo-credit-001', current: -1245.67, available: 3754.33, currency: 'USD' },
      ];
    }

    try {
      const response = await plaidClient.accountsBalanceGet({
        access_token: accessToken,
      });

      return response.data.accounts.map((acc: any) => ({
        accountId: acc.account_id,
        current: acc.balances.current,
        available: acc.balances.available,
        currency: acc.balances.iso_currency_code,
      }));
    } catch (error) {
      console.error('Failed to fetch Plaid balances:', error);
      throw error;
    }
  },

  async getTransactions(accessToken: string, startDate: Date, endDate: Date) {
    // Handle demo access tokens
    if (accessToken.startsWith('demo-')) {
      console.log('Returning demo transactions');
      const demoTransactions = [
        { id: 'demo-txn-1', accountId: 'demo-checking-001', amount: 5.67, description: 'Starbucks', merchant: 'Starbucks', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'FOOD_AND_DRINK', pending: false, currency: 'USD' },
        { id: 'demo-txn-2', accountId: 'demo-checking-001', amount: 127.43, description: 'Whole Foods', merchant: 'Whole Foods', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'FOOD_AND_DRINK', pending: false, currency: 'USD' },
        { id: 'demo-txn-3', accountId: 'demo-checking-001', amount: 49.99, description: 'Amazon', merchant: 'Amazon', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'SHOPPING', pending: false, currency: 'USD' },
        { id: 'demo-txn-4', accountId: 'demo-checking-001', amount: 24.50, description: 'Uber', merchant: 'Uber', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'TRANSPORTATION', pending: false, currency: 'USD' },
        { id: 'demo-txn-5', accountId: 'demo-checking-001', amount: 15.00, description: 'Netflix', merchant: 'Netflix', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'ENTERTAINMENT', pending: false, currency: 'USD' },
        { id: 'demo-txn-6', accountId: 'demo-checking-001', amount: 82.15, description: 'Shell Gas Station', merchant: 'Shell', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'TRANSPORTATION', pending: false, currency: 'USD' },
        { id: 'demo-txn-7', accountId: 'demo-savings-001', amount: -5000.00, description: 'Salary Deposit', merchant: 'Employer Inc', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'INCOME', pending: false, currency: 'USD' },
        { id: 'demo-txn-8', accountId: 'demo-credit-001', amount: 125.00, description: 'Electric Bill', merchant: 'Power Company', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'UTILITIES', pending: false, currency: 'USD' },
      ];
      return demoTransactions;
    }

    console.log('Fetching real Plaid transactions');
    
    const transactions = [];
    let hasMore = true;
    let offset = 0;

    try {
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
          category: txn.personal_finance_category?.primary || txn.category?.[0] || 'other',
          pending: txn.pending,
          currency: txn.iso_currency_code,
        })));

        hasMore = transactions.length < response.data.total_transactions;
        offset += response.data.transactions.length;
      }

      return transactions;
    } catch (error) {
      console.error('Failed to fetch Plaid transactions:', error);
      throw error;
    }
  },

  async revokeAccess(accessToken: string) {
    // Skip for demo tokens
    if (accessToken.startsWith('demo-')) {
      console.log('Skipping revoke for demo token');
      return;
    }

    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
      console.log('Plaid access revoked successfully');
    } catch (e) {
      console.error('Failed to revoke Plaid access:', e);
      // Don't throw - we still want to disconnect locally
    }
  },

  async handleWebhook(payload: any) {
    const { webhook_type, webhook_code, item_id } = payload;

    console.log('Plaid webhook received:', { webhook_type, webhook_code, item_id });

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'INITIAL_UPDATE') {
      return { itemId: item_id, type: 'transactions_ready' };
    }

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'HISTORICAL_UPDATE') {
      return { itemId: item_id, type: 'historical_ready' };
    }

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'DEFAULT_UPDATE') {
      return { itemId: item_id, type: 'new_transactions' };
    }

    return { itemId: item_id };
  },
};
