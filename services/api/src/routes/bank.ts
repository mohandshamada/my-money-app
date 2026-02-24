// @ts-nocheck
import { Router } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { plaidProvider } from '../providers/plaid';
import { trueLayerProvider } from '../providers/truelayer';
import { yodleeProvider } from '../providers/yodlee';
import { belvoProvider } from '../providers/belvo';

const router = Router();
const prisma = new PrismaClient();

// Provider registry
const providers = {
  plaid: plaidProvider,
  truelayer: trueLayerProvider,
  yodlee: yodleeProvider,
  belvo: belvoProvider,
};

// Get available providers based on user's region
router.get('/providers', async (req: any, res: any) => {
  try {
    const { region } = req.query;
    
    const availableProviders = Object.entries(providers)
      .filter(([_, provider]) => provider.isAvailable())
      .map(([key, provider]) => ({
        id: key,
        name: provider.name,
        logo: provider.logo,
        regions: provider.regions,
        supportedInRegion: region ? provider.regions.includes(region) : true,
        features: provider.features,
      }));

    res.json({ providers: availableProviders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Create link token for specific provider
router.post('/link-token/:provider', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;
    const { redirectUri } = req.body;

    const providerInstance = providers[provider as keyof typeof providers];
    if (!providerInstance || !providerInstance.isAvailable()) {
      return res.status(400).json({ error: 'Provider not available' });
    }

    const linkToken = await providerInstance.createLinkToken(userId, redirectUri);
    res.json({ link_token: linkToken, provider });
  } catch (error) {
    next(error);
  }
});

// Exchange token (unified endpoint)
router.post('/connect/:provider', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;
    const { public_token, metadata } = req.body;

    const providerInstance = providers[provider as keyof typeof providers];
    if (!providerInstance) {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // Exchange token and get connection details
    const connection = await providerInstance.exchangeToken(
      userId,
      public_token,
      metadata
    );

    // Store connection in database
    const dbConnection = await prisma.bankConnection.create({
      data: {
        userId,
        provider,
        providerAccessToken: connection.accessToken,
        providerItemId: connection.itemId,
        providerRefreshToken: connection.refreshToken,
        institutionName: metadata.institution?.name || 'Unknown Bank',
        institutionLogoUrl: metadata.institution?.logo,
        institutionId: metadata.institution?.id,
        syncStatus: 'connected',
        connectedAt: new Date(),
      },
    });

    // Sync initial accounts and transactions
    await syncConnection(dbConnection);

    res.json({ success: true, connection: dbConnection });
  } catch (error) {
    next(error);
  }
});

// Get all connected accounts across all providers
router.get('/accounts', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    
    const connections = await prisma.bankConnection.findMany({
      where: { 
        userId, 
        disconnectedAt: null,
      },
      include: { 
        accounts: {
          where: { disconnected: false }
        } 
      },
      orderBy: { connectedAt: 'desc' },
    });

    // Enrich with real-time balance if supported
    const enrichedConnections = await Promise.all(
      connections.map(async (conn) => {
        const provider = providers[conn.provider as keyof typeof providers];
        if (provider?.supportsRealtimeBalance && conn.providerAccessToken) {
          try {
            const balances = await provider.getBalances(conn.providerAccessToken);
            // Update balances in response
            conn.accounts = conn.accounts.map((acc) => {
              const balance = balances.find((b: any) => b.accountId === acc.providerAccountId);
              if (balance) {
                acc.currentBalance = balance.current;
                acc.availableBalance = balance.available;
              }
              return acc;
            });
          } catch (e) {
            console.error('Failed to fetch real-time balance:', e);
          }
        }
        return conn;
      })
    );

    res.json({ connections: enrichedConnections });
  } catch (error) {
    next(error);
  }
});

// Get accounts for a specific connection
router.get('/accounts/:connectionId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;

    const accounts = await prisma.bankAccount.findMany({
      where: { 
        connectionId,
        connection: { userId },
        disconnected: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ accounts });
  } catch (error) {
    next(error);
  }
});

// Sync specific connection
router.post('/sync/:connectionId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;
    const { force = false } = req.body;

    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId, disconnectedAt: null },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Check if sync is needed (throttle unless force)
    if (!force && connection.lastSyncedAt) {
      const lastSync = new Date(connection.lastSyncedAt);
      const minutesSinceSync = (Date.now() - lastSync.getTime()) / 60000;
      if (minutesSinceSync < 5) {
        return res.json({ 
          success: true, 
          skipped: true, 
          message: 'Synced recently. Use force=true to override.' 
        });
      }
    }

    await syncConnection(connection);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Sync all connections for user
router.post('/sync-all', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;

    const connections = await prisma.bankConnection.findMany({
      where: { userId, disconnectedAt: null },
    });

    const results = await Promise.allSettled(
      connections.map(conn => syncConnection(conn))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({ 
      success: true, 
      synced: successful, 
      failed,
      total: connections.length 
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect specific account
router.delete('/accounts/:accountId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.params;

    await prisma.bankAccount.updateMany({
      where: { 
        id: accountId,
        connection: { userId }
      },
      data: { disconnected: true, disconnectedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Disconnect entire connection
router.delete('/connections/:connectionId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;

    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Notify provider to revoke access
    const provider = providers[connection.provider as keyof typeof providers];
    if (provider?.revokeAccess) {
      try {
        await provider.revokeAccess(connection.providerAccessToken);
      } catch (e) {
        console.error('Failed to revoke provider access:', e);
      }
    }

    // Soft delete connection
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { 
        disconnectedAt: new Date(),
        providerAccessToken: null, // Clear sensitive data
        providerRefreshToken: null,
      },
    });

    // Mark accounts as disconnected
    await prisma.bankAccount.updateMany({
      where: { connectionId },
      data: { disconnected: true, disconnectedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// OAuth callback handler for TrueLayer
router.get('/callback/truelayer', async (req: any, res: any) => {
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      console.error('TrueLayer OAuth error:', error, error_description);
      return res.redirect('/settings?bank_error=' + encodeURIComponent(error_description || error));
    }
    
    if (!code) {
      return res.redirect('/settings?bank_error=missing_code');
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://auth.truelayer-sandbox.com/connect/token',
      {
        grant_type: 'authorization_code',
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.API_URL}/api/bank/callback/truelayer`,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    // Get user info from token or session
    // For now, redirect to frontend with token
    res.redirect(`/settings?bank_success=truelayer&token=${encodeURIComponent(access_token)}`);
  } catch (err: any) {
    console.error('TrueLayer callback error:', err.response?.data || err.message);
    res.redirect('/settings?bank_error=callback_failed');
  }
});

// Webhook handler (unified)
router.post('/webhook/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const providerInstance = providers[provider as keyof typeof providers];
    
    if (!providerInstance?.handleWebhook) {
      return res.sendStatus(200);
    }

    const result = await providerInstance.handleWebhook(req.body);
    
    if (result.itemId) {
      const connection = await prisma.bankConnection.findFirst({
        where: { providerItemId: result.itemId },
      });

      if (connection) {
        await syncConnection(connection);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200);
  }
});

// Helper: Sync a connection
async function syncConnection(connection: any) {
  const provider = providers[connection.provider as keyof typeof providers];
  if (!provider) {
    throw new Error(`Unknown provider: ${connection.provider}`);
  }

  await prisma.bankConnection.update({
    where: { id: connection.id },
    data: { syncStatus: 'syncing' },
  });

  try {
    // Sync accounts
    const accounts = await provider.getAccounts(connection.providerAccessToken);
    
    for (const acc of accounts) {
      await prisma.bankAccount.upsert({
        where: {
          connectionId_providerAccountId: {
            connectionId: connection.id,
            providerAccountId: acc.id,
          },
        },
        update: {
          name: acc.name,
          accountType: acc.type,
          accountSubtype: acc.subtype,
          currentBalance: acc.balance?.current,
          availableBalance: acc.balance?.available,
          currency: acc.currency,
          lastSyncedAt: new Date(),
        },
        create: {
          connectionId: connection.id,
          providerAccountId: acc.id,
          name: acc.name,
          accountType: acc.type,
          accountSubtype: acc.subtype,
          currentBalance: acc.balance?.current,
          availableBalance: acc.balance?.available,
          currency: acc.currency,
        },
      });
    }

    // Sync transactions (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const transactions = await provider.getTransactions(
      connection.providerAccessToken,
      startDate,
      new Date()
    );

    for (const txn of transactions) {
      await prisma.transaction.upsert({
        where: {
          userId_providerTransactionId: {
            userId: connection.userId,
            providerTransactionId: txn.id,
          },
        },
        update: {
          amount: txn.amount,
          pending: txn.pending,
        },
        create: {
          userId: connection.userId,
          bankConnectionId: connection.id,
          bankAccountId: txn.accountId,
          amount: Math.abs(txn.amount),
          isExpense: txn.amount > 0,
          merchant: txn.merchant || txn.description,
          description: txn.description,
          date: new Date(txn.date),
          category: txn.category || 'other',
          pending: txn.pending,
          providerTransactionId: txn.id,
          currency: txn.currency,
        },
      });
    }

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        syncErrorMessage: null,
      },
    });
  } catch (error) {
    console.error(`Sync error for connection ${connection.id}:`, error);
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        syncStatus: 'error',
        syncErrorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

export { router as bankRouter };
