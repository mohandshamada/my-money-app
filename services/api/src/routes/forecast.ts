import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get forecast
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const scenario = (req.query.scenario as string) || 'baseline';
    
    // Get user's transactions for pattern analysis
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 100
    });
    
    // Simple forecast calculation (simplified version)
    const currentBalance = transactions.reduce((acc, t) => {
      return t.isExpense ? acc - Number(t.amount) : acc + Number(t.amount);
    }, 0);
    
    const forecast = [];
    let balance = currentBalance;
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Simple projection (would use Monte Carlo in production)
      const dailyChange = 0; // Placeholder
      balance += dailyChange;
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        projectedBalance: balance,
        confidenceLow68: balance * 0.9,
        confidenceHigh68: balance * 1.1,
        confidenceLow95: balance * 0.8,
        confidenceHigh95: balance * 1.2
      });
    }
    
    res.json({
      forecast,
      summary: {
        currentBalance,
        projectedBalance30d: forecast[29]?.projectedBalance || balance,
        projectedBalance365d: forecast[364]?.projectedBalance || balance
      }
    });
  } catch (error) {
    next(error);
  }
});

// What-if scenario
router.post('/what-if', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      scenarioName: z.string(),
      changes: z.array(z.object({
        category: z.string(),
        newAmount: z.number()
      }))
    });
    
    const data = schema.parse(req.body);
    
    // Placeholder for what-if calculation
    res.json({
      originalProjection: 10000,
      scenarioProjection: 9500,
      difference: -500
    });
  } catch (error) {
    next(error);
  }
});

export { router as forecastRouter };
