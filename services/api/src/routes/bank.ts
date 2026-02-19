import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Placeholder routes for Plaid integration
router.post('/create-link-token', async (req: AuthRequest, res) => {
  res.json({ linkToken: 'placeholder', expiration: new Date().toISOString() });
});

router.post('/exchange-token', async (req: AuthRequest, res) => {
  res.json({ bankConnectionId: 'placeholder', institutionName: 'Bank', accountsCount: 1 });
});

router.get('/accounts', async (req: AuthRequest, res) => {
  res.json({ accounts: [] });
});

router.post('/sync', async (req: AuthRequest, res) => {
  res.json({ bankConnections: [] });
});

router.delete('/disconnect/:id', async (req: AuthRequest, res) => {
  res.status(204).send();
});

export { router as bankRouter };
