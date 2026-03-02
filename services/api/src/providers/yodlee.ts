// Yodlee Provider Implementation (Global - US, UK, AU, etc.)
import axios from 'axios';

const YODLEE_BASE_URL = process.env.YODLEE_ENV === 'live'
  ? 'https://api.yodlee.com/ysl'
  : 'https://sandbox.api.yodlee.com.au/ysl';

// Yodlee admin login name format for sandbox
// Typically: sbMem_{username}_{number} or just the admin username
const YODLEE_ADMIN_LOGIN = process.env.YODLEE_ADMIN_LOGIN_NAME || 'sbMem_mymoney_1';

export const yodleeProvider = {
  name: 'Yodlee',
  logo: 'https://www.yodlee.com/sites/default/files/yodlee-logo-new.svg',
  // Yodlee supports 1400+ financial institutions across 80+ countries
  regions: ['US', 'GB', 'AU', 'CA', 'IN', 'SG', 'HK', 'EG', 'ZA', 'NG', 'KE', 'GH', 'AE', 'SA', 'QA', 'KW', 'BH', 'JO', 'LB', 'IL', 'TR', 'PK', 'BD', 'LK', 'NP', 'MM', 'KH', 'LA', 'MN', 'UZ', 'KZ', 'KG', 'TJ', 'TM', 'AF', 'IR', 'IQ', 'SY', 'YE', 'OM', 'PS', 'MV', 'BT', 'VN', 'PH', 'ID', 'MY', 'TH', 'JP', 'KR', 'CN', 'TW', 'HK', 'MO', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'KI', 'TO', 'NR', 'TV', 'CK', 'NU', 'TK', 'AS', 'GU', 'MP', 'PW', 'FM', 'MH', 'NC', 'PF', 'WF', 'PM', 'BL', 'MF', 'GP', 'MQ', 'RE', 'YT', 'TF', 'BV', 'HM', 'IO', 'CX', 'CC', 'NF', 'PN', 'GS', 'FK', 'SH', 'AC', 'TA', 'AQ', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'PY', 'BO', 'VE', 'EC', 'GY', 'SR', 'GF', 'PA', 'CR', 'GT', 'HN', 'SV', 'NI', 'DO', 'CU', 'PR', 'JM', 'HT', 'BS', 'KY', 'VG', 'AI', 'KN', 'LC', 'VC', 'GD', 'AG', 'DM', 'VI', 'BZ', 'SR', 'GY', 'GF', 'MX'],  features: ['accounts', 'transactions', 'balance'],
  supportsRealtimeBalance: true,

  isAvailable(): boolean {
    const clientId = process.env.YODLEE_CLIENT_ID;
    const secret = process.env.YODLEE_SECRET;
    const adminLoginName = process.env.YODLEE_ADMIN_LOGIN_NAME;
    const hasRealCredentials = !!(clientId && secret && adminLoginName &&
              !clientId.includes('your_') && 
              !secret.includes('your_'));
    
    // Demo mode
    const demoMode = process.env.BANK_DEMO_MODE === 'true';
    
    return hasRealCredentials || demoMode;
  },

  async getAccessToken(): Promise<string> {
    const clientId = process.env.YODLEE_CLIENT_ID!;
    const secret = process.env.YODLEE_SECRET!;
    const adminLoginName = YODLEE_ADMIN_LOGIN;

    try {
      console.log('Attempting Yodlee auth with loginName:', adminLoginName);
      
      // Yodlee auth requires form-urlencoded body
      const params = new URLSearchParams();
      params.append('clientId', clientId);
      params.append('secret', secret);

      const response = await axios.post(
        `${YODLEE_BASE_URL}/auth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'loginName': adminLoginName,
            'Api-Version': '1.1',
          },
        }
      );

      if (!response.data.token?.accessToken) {
        console.error('Yodlee auth response:', response.data);
        throw new Error('No access token in response');
      }

      console.log('Yodlee auth successful');
      return response.data.token.accessToken;
    } catch (error: any) {
      console.error('Yodlee auth failed:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.errorMessage || error.message;
      throw new Error(`Yodlee authentication failed: ${errorMsg}`);
    }
  },

  async createLinkToken(userId: string, redirectUri?: string): Promise<string> {
    try {
      // Use the exact FastLink URL provided by user
      // The 'anzdevexsandbox' is the configured app name, not the client ID
      const authUrl = 'https://fl4.sandbox.yodlee.com.au/authenticate/anzdevexsandbox/fastlink/';

      console.log('Generated Yodlee FastLink URL:', authUrl);

      // Return base64 encoded object
      return Buffer.from(JSON.stringify({
        provider: 'yodlee',
        authUrl: authUrl,
        userId: userId,
      })).toString('base64');
    } catch (error: any) {
      console.error('Failed to create Yodlee link token:', error.message);
      throw error;
    }
  },

  async exchangeToken(userId: string, publicToken: string, metadata: any) {
    // Yodlee uses providerAccountId for account linking
    // The publicToken would be the providerAccountId from the callback
    return {
      accessToken: publicToken, // This is the providerAccountId
      refreshToken: '',
      itemId: publicToken,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  },

  async getAccounts(accessToken: string) {
    const response = await axios.get(
      `${YODLEE_BASE_URL}/accounts`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return response.data.account.map((acc: any) => ({
      id: acc.id,
      name: acc.accountName || `${acc.accountType} Account`,
      type: acc.accountType,
      subtype: acc.accountType === 'SAVINGS' ? 'savings' : 'checking',
      mask: acc.accountNumber?.slice(-4),
      balance: {
        current: acc.balance?.amount,
        available: acc.availableBalance?.amount,
      },
      currency: acc.balance?.currency,
    }));
  },

  async getBalances(accessToken: string) {
    const accounts = await this.getAccounts(accessToken);
    return accounts.map((acc: any) => ({
      accountId: acc.id,
      current: acc.balance.current,
      available: acc.balance.available,
      currency: acc.currency,
    }));
  },

  async getTransactions(accessToken: string, startDate: Date, endDate: Date) {
    const response = await axios.get(
      `${YODLEE_BASE_URL}/transactions`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fromDate: startDate.toISOString().split('T')[0],
          toDate: endDate.toISOString().split('T')[0],
        },
      }
    );

    return response.data.transaction.map((txn: any) => ({
      id: txn.id,
      accountId: txn.accountId,
      amount: txn.amount?.amount,
      description: txn.description?.description || txn.description?.original,
      merchant: txn.merchant?.name,
      date: new Date(txn.transactionDate),
      category: txn.category?.toLowerCase() || 'other',
      pending: txn.status === 'PENDING',
      currency: txn.amount?.currency,
    }));
  },

  async revokeAccess(accessToken: string) {
    try {
      await axios.delete(`${YODLEE_BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      console.error('Failed to revoke Yodlee access:', e);
    }
  },

  async handleWebhook(payload: any) {
    const { eventType, providerAccountId } = payload;

    if (eventType === 'REFRESH_COMPLETED') {
      return { itemId: providerAccountId, type: 'refresh_complete' };
    }

    return { itemId: providerAccountId };
  },
};