// TrueLayer Provider Implementation (UK/EU)
import axios from 'axios';

const TRUELAYER_BASE_URL = process.env.TRUELAYER_ENV === 'live' 
  ? 'https://api.truelayer.com'
  : 'https://api.truelayer-sandbox.com';

// Working auth link configuration from user
const TRUELAYER_AUTH_URL = process.env.TRUELAYER_ENV === 'live'
  ? 'https://auth.truelayer.com'
  : 'https://auth.truelayer-sandbox.com';

export const trueLayerProvider = {
  name: 'TrueLayer',
  logo: 'https://truelayer.com/img/logo.svg',
  regions: ['GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT'],
  features: ['accounts', 'transactions', 'balance', 'cards', 'direct_debits', 'standing_orders'],
  supportsRealtimeBalance: true,

  isAvailable(): boolean {
    const clientId = process.env.TRUELAYER_CLIENT_ID;
    const secret = process.env.TRUELAYER_CLIENT_SECRET;
    const hasRealCredentials = !!(clientId && secret && 
              !clientId.includes('your_') && 
              !secret.includes('your_'));
    
    // Demo mode
    const demoMode = process.env.BANK_DEMO_MODE === 'true';
    
    return hasRealCredentials || demoMode;
  },

  async createLinkToken(userId: string, redirectUri?: string): Promise<string> {
    const clientId = process.env.TRUELAYER_CLIENT_ID;
    
    // Use the working redirect URI from TrueLayer console
    const redirect_uri = 'https://console.truelayer.com/redirect-page';
    
    // Use the full scope from the working auth link
    const scope = 'info accounts balance cards transactions direct_debits standing_orders offline_access verification signupplus';
    
    // Include all providers including Mock Bank
    const providers = 'uk-cs-mock uk-ob-all uk-oauth-all';
    
    // Build auth URL exactly like the working example
    const authUrl = `${TRUELAYER_AUTH_URL}/?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}&providers=${encodeURIComponent(providers)}`;

    console.log('Generated TrueLayer auth URL:', authUrl);
    
    // Return simple object with auth URL
    return JSON.stringify({
      provider: 'truelayer',
      authUrl: authUrl,
      userId: userId
    });
  },

  async exchangeToken(userId: string, publicToken: string, metadata: any) {
    const response = await axios.post(
      `${TRUELAYER_BASE_URL}/connect/token`,
      {
        grant_type: 'authorization_code',
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        code: publicToken,
        redirect_uri: 'https://console.truelayer.com/redirect-page',
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      itemId: response.data.credentials_id,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    };
  },

  async getAccounts(accessToken: string) {
    const response = await axios.get(
      `${TRUELAYER_BASE_URL}/data/v1/accounts`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return response.data.results.map((acc: any) => ({
      id: acc.account_id,
      name: acc.display_name || `${acc.account_type} Account`,
      type: acc.account_type,
      subtype: acc.account_type === 'savings' ? 'savings' : 'checking',
      mask: acc.account_number?.number?.slice(-4),
      balance: {
        current: acc.balance?.current,
        available: acc.balance?.available,
      },
      currency: acc.currency,
    }));
  },

  async getBalances(accessToken: string) {
    const response = await axios.get(
      `${TRUELAYER_BASE_URL}/data/v1/accounts`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return response.data.results.map((acc: any) => ({
      accountId: acc.account_id,
      current: acc.balance?.current,
      available: acc.balance?.available,
      currency: acc.currency,
    }));
  },

  async getTransactions(accessToken: string, startDate: Date, endDate: Date) {
    const accounts = await this.getAccounts(accessToken);
    const allTransactions = [];

    for (const account of accounts) {
      try {
        const response = await axios.get(
          `${TRUELAYER_BASE_URL}/data/v1/accounts/${account.id}/transactions`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              from: startDate.toISOString().split('T')[0],
              to: endDate.toISOString().split('T')[0],
            },
          }
        );

        allTransactions.push(...response.data.results.map((txn: any) => ({
          id: txn.transaction_id,
          accountId: account.id,
          amount: txn.amount,
          description: txn.description,
          merchant: txn.merchant_name,
          date: txn.timestamp ? new Date(txn.timestamp) : new Date(txn.date),
          category: txn.transaction_category?.[0] || 'other',
          pending: txn.status === 'pending',
          currency: txn.currency,
        })));
      } catch (e) {
        console.error(`Failed to fetch transactions for account ${account.id}:`, e);
      }
    }

    return allTransactions;
  },

  async revokeAccess(accessToken: string) {
    try {
      await axios.delete(`${TRUELAYER_BASE_URL}/api/v1/connection`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      console.error('Failed to revoke TrueLayer access:', e);
    }
  },

  async refreshToken(refreshToken: string) {
    const response = await axios.post(
      `${TRUELAYER_BASE_URL}/connect/token`,
      {
        grant_type: 'refresh_token',
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        refresh_token: refreshToken,
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    };
  },

  async handleWebhook(payload: any) {
    const { event_type, credentials_id } = payload;

    if (event_type === 'connection_status_changed') {
      return { itemId: credentials_id, type: 'status_change' };
    }

    return { itemId: credentials_id };
  },
};
