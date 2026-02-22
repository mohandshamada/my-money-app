import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const budgetSchema = z.object({
  category: z.string(),
  amount: z.number().positive(),
  periodType: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  rollover: z.boolean().optional()
});

// Get all budgets
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });
    
    // Calculate spent amounts
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId,
            category: budget.category,
            isExpense: true,
            date: {
              gte: budget.startDate,
              lte: budget.endDate || new Date()
            }
          },
          _sum: { amount: true }
        });
        
        const spentAmount = Number(spent._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        
        return {
          ...budget,
          spent: spentAmount,
          remaining: budgetAmount - spentAmount,
          status: spentAmount > budgetAmount ? 'overspent' : 'on_track'
        };
      })
    );
    
    res.json({ budgets: budgetsWithStatus });
  } catch (error) {
    next(error);
  }
});

// Create budget
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const data = budgetSchema.parse(req.body);
    const userId = req.user!.id;
    
    const budget = await prisma.budget.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        userId
      }
    });
    
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});

// Update budget
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const data = budgetSchema.partial().parse(req.body);
    const userId = req.user!.id;
    
    const budget = await prisma.budget.update({
      where: { id, userId },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined
      }
    });
    
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Delete budget
router.delete('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    await prisma.budget.delete({
      where: { id, userId }
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as budgetRouter };
