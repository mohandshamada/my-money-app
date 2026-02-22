import { Router } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Initialize Plaid client
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

// Create link token
router.post('/link-token', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    
    const tokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'My Money',
      products: [Products.Transactions, Products.Auth],
      country_codes: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'IE'],
      language: 'en',
      webhook: `${process.env.API_URL}/api/bank/webhook`,
    });

    res.json({ link_token: tokenResponse.data.link_token });
  } catch (error) {
    next(error);
  }
});

// Exchange public token for access token
router.post('/exchange-token', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { public_token, institution_name, institution_logo } = req.body;

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const access_token = exchangeResponse.data.access_token;
    const item_id = exchangeResponse.data.item_id;

    // Store in database
    const connection = await prisma.bankConnection.create({
      data: {
        userId,
        plaidAccessToken: access_token,
        plaidItemId: item_id,
        institutionName: institution_name,
        institutionLogoUrl: institution_logo,
        syncStatus: 'connected',
        connectedAt: new Date(),
      },
    });

    // Fetch initial transactions
    await syncTransactions(userId, access_token, item_id);

    res.json({ success: true, connection });
  } catch (error) {
    next(error);
  }
});

// Get connected accounts
router.get('/accounts', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    
    const connections = await prisma.bankConnection.findMany({
      where: { userId, disconnectedAt: null },
      include: { accounts: true },
    });

    res.json({ connections });
  } catch (error) {
    next(error);
  }
});

// Sync transactions manually
router.post('/sync/:itemId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    const connection = await prisma.bankConnection.findFirst({
      where: { plaidItemId: itemId, userId },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    await syncTransactions(userId, connection.plaidAccessToken, itemId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Disconnect bank
router.delete('/disconnect/:itemId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    await prisma.bankConnection.updateMany({
      where: { plaidItemId: itemId, userId },
      data: { disconnectedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const { webhook_type, item_id } = req.body;

    if (webhook_type === 'TRANSACTIONS') {
      const connection = await prisma.bankConnection.findFirst({
        where: { plaidItemId: item_id },
      });

      if (connection) {
        await syncTransactions(connection.userId, connection.plaidAccessToken, item_id);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200); // Still return 200 to prevent retries
  }
});

// Helper: Sync transactions from Plaid
async function syncTransactions(userId: string, accessToken: string, itemId: string) {
  try {
    // Get transactions from last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    const transactions = transactionsResponse.data.transactions;

    // Store transactions
    for (const txn of transactions) {
      await prisma.transaction.upsert({
        where: {
          userId_plaidTransactionId: {
            userId,
            plaidTransactionId: txn.transaction_id,
          },
        },
        update: {
          amount: txn.amount,
          pending: txn.pending,
        },
        create: {
          userId,
          bankConnectionId: itemId,
          amount: txn.amount,
          isExpense: txn.amount > 0,
          merchant: txn.merchant_name || txn.name,
          description: txn.name,
          date: new Date(txn.date),
          category: txn.personal_finance_category?.primary || 'other',
          subcategory: txn.personal_finance_category?.detailed,
          pending: txn.pending,
          plaidTransactionId: txn.transaction_id,
          accountId: txn.account_id,
        },
      });
    }

    // Update sync status
    await prisma.bankConnection.update({
      where: { plaidItemId: itemId },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    await prisma.bankConnection.update({
      where: { plaidItemId: itemId },
      data: {
        syncStatus: 'error',
        syncErrorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

export { router as bankRouter };
