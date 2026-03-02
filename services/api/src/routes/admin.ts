import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  return user?.role === 'admin' || user?.email?.includes('admin') || false;
}

const adminMiddleware = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!await isAdmin(userId)) return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin check failed' });
  }
};

router.get('/stats', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const [totalUsers, totalTransactions, usersByTier] = await Promise.all([
      prisma.users.count(),
      prisma.transactions.count(),
      prisma.user_settings.groupBy({ by: ['subscription_tier'], _count: { subscription_tier: true } })
    ]);

    const tierPrices: Record<string, number> = { free: 0, standard: 9, premium: 29 };
    const monthlyRevenue = usersByTier.reduce((sum, tier) => {
      return sum + ((tierPrices[tier.subscription_tier] || 0) * tier._count.subscription_tier);
    }, 0);

    res.json({ totalUsers, totalTransactions, monthlyRevenue,
      usersByTier: usersByTier.map(t => ({ tier: t.subscription_tier, count: t._count.subscription_tier }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { email: { contains: String(search), mode: 'insensitive' as const } },
        { full_name: { contains: String(search), mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where, skip, take: Number(limit), orderBy: { created_at: 'desc' },
        include: { user_settings: true, _count: { select: { transactions: true } } }
      }),
      prisma.users.count({ where })
    ]);

    res.json({
      users: users.map(u => ({
        id: u.id, email: u.email, full_name: u.full_name, role: u.role,
        tier: u.user_settings?.subscription_tier || 'free',
        transactionCount: u._count.transactions
      })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/tier', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { tier, expiresAt } = req.body;
    await prisma.user_settings.upsert({
      where: { user_id: id },
      create: { user_id: id, subscription_tier: tier, subscription_expires_at: expiresAt ? new Date(expiresAt) : null },
      update: { subscription_tier: tier, subscription_expires_at: expiresAt ? new Date(expiresAt) : null }
    });
    res.json({ success: true, message: 'User tier updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

router.delete('/users/:id', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }
    await prisma.users.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.put('/users/:id/role', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (id === req.user?.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote your own admin account' });
    }
    await prisma.users.update({
      where: { id },
      data: { role }
    });
    res.json({ success: true, message: 'User role updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.get('/health', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const dbHealth = await prisma.$queryRaw`SELECT 1`.then(() => 'healthy').catch(() => 'unhealthy');
    res.json({ database: dbHealth, timestamp: new Date().toISOString(), uptime: process.uptime() });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Impersonate endpoint
router.post('/users/:id/impersonate', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({ where: { id } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
    
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions["expiresIn"] });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

router.get('/metrics', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const dbStats = await Promise.all([
      prisma.users.count(),
      prisma.transactions.count(),
      prisma.subscriptions.count(),
      prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size`
    ]);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [newUsersToday, newTransactionsToday] = await Promise.all([
      prisma.users.count({ where: { created_at: { gte: yesterday } } }),
      prisma.transactions.count({ where: { created_at: { gte: yesterday } } })
    ]);

    res.json({
      database: {
        size: dbStats[3]?.[0]?.db_size || 'unknown',
        users: dbStats[0],
        transactions: dbStats[1],
        subscriptions: dbStats[2]
      },
      activity: {
        newUsersToday,
        newTransactionsToday,
        timestamp: new Date().toISOString()
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/logs', authMiddleware as any, adminMiddleware as any, async (req: any, res: any) => {
  try {
    const recentActivity = await prisma.transactions.findMany({
      take: 50,
      orderBy: { created_at: 'desc' },
      include: { users: { select: { email: true } } }
    });

    const logs = recentActivity.map(t => ({
      timestamp: t.created_at,
      action: (t as any).imported ? 'imported_transaction' : 'manual_transaction',
      user: t.users?.email || 'unknown',
      details: `${t.is_expense ? 'Expense' : 'Income'}: ${t.merchant || t.description} (${t.amount})`
    }));

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;