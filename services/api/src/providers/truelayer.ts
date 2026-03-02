// TrueLayer Provider Implementation (UK/EU)
import axios from 'axios';

const TRUELAYER_BASE_URL = process.env.TRUELAYER_ENV === 'live'
  ? 'https://api.truelayer.com'
  : 'https://api.truelayer-sandbox.com';

const TRUELAYER_AUTH_URL = process.env.TRUELAYER_ENV === 'live'
  ? 'https://auth.truelayer.com'
  : 'https://auth.truelayer-sandbox.com';

// MUST match redirect_uri in createLinkToken - same value for token exchange
const TRUELAYER_REDIRECT_URI = process.env.TRUELAYER_REDIRECT_URI || 'https://console.truelayer.com/redirect-page';

// Exact strings from working auth URL (spaces encoded as %20 in URL)
const TRUELAYER_SCOPE = 'info accounts balance cards transactions direct_debits standing_orders offline_access verification signupplus';
const TRUELAYER_PROVIDERS = 'uk-cs-mock uk-ob-all uk-oauth-all';

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

    const demoMode = process.env.BANK_DEMO_MODE === 'true';
    return hasRealCredentials || demoMode;
  },

  async createLinkToken(userId: string, _redirectUri?: string): Promise<string> {
    const isLive = process.env.TRUELAYER_ENV === 'live';
    const clientId = process.env.TRUELAYER_CLIENT_ID || (isLive ? '' : 'sandbox-mymoney-6e1a9f');
    if (!clientId) {
      throw new Error('TRUELAYER_CLIENT_ID is required for live environment');
    }

    // Build auth URL to match working format exactly (spaces as %20, no state)
    const q = [
      'response_type=code',
      `client_id=${encodeURIComponent(clientId)}`,
      `scope=${encodeURIComponent(TRUELAYER_SCOPE)}`,
      `redirect_uri=${encodeURIComponent(TRUELAYER_REDIRECT_URI)}`,
      `providers=${encodeURIComponent(TRUELAYER_PROVIDERS)}`,
    ].join('&');
    const authUrl = `${TRUELAYER_AUTH_URL}/?${q}`;

    console.log('[TrueLayer] authUrl generated:', authUrl);

    const payload = {
      provider: 'truelayer',
      authUrl,
      userId,
    };
    const linkToken = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
    console.log('[TrueLayer] link_token (first 80 chars):', linkToken.slice(0, 80) + '...');
    return linkToken;
  },

  async exchangeToken(userId: string, publicToken: string, metadata: any) {
    // MUST use same redirect_uri as in createLinkToken
    const redirect_uri = TRUELAYER_REDIRECT_URI;
    const response = await axios.post(
      `${TRUELAYER_BASE_URL}/connect/token`,
      {
        grant_type: 'authorization_code',
        client_id: process.env.TRUELAYER_CLIENT_ID || (process.env.TRUELAYER_ENV === 'live' ? undefined : 'sandbox-mymoney-6e1a9f'),
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        code: publicToken,
        redirect_uri,
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
