// @ts-nocheck
import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const transactionSchema = z.object({
  amount: z.number().positive(),
  isExpense: z.boolean(),
  merchant: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime(),
  category: z.string(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pending: z.boolean().optional()
});

// Get all transactions
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, category, limit = '20', offset = '0' } = req.query;
    
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    
    if (category) {
      where.category = category;
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transactions.findMany({
        where,
        orderBy: { date: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.transactions.count({ where })
    ]);
    
    res.json({
      transactions,
      total,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    next(error);
  }
});

// Create transaction
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const data = transactionSchema.parse(req.body);
    const userId = req.user!.id;
    
    const transaction = await prisma.transactions.create({
      data: { ...req.body as any,
        ...data,
        date: new Date(data.date),
        userId
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

// Update transaction
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const data = transactionSchema.partial().parse(req.body);
    const userId = req.user!.id;
    
    const transaction = await prisma.transactions.update({
      where: { id, userId },
      data: { ...req.body as any,
        ...data,
        date: data.date ? new Date(data.date) : undefined
      }
    });
    
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

// Delete transaction
router.delete('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    await prisma.transactions.delete({
      where: { id, userId }
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Import CSV
router.post('/import', async (req: any, res: any, next: any) => {
  try {
    // Placeholder for CSV import logic
    // Would parse CSV, map columns, create transactions
    res.json({ imported: 0, duplicatesSkipped: 0, errors: 0 });
  } catch (error) {
    next(error);
  }
});

// Export transactions as CSV
router.get('/export', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    
    const transactions = await prisma.transactions.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    
    // Generate CSV
    const headers = ['Date', 'Amount', 'Type', 'Category', 'Merchant', 'Description', 'Pending'];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.amount.toFixed(2),
      t.isExpense ? 'Expense' : 'Income',
      t.category,
      t.merchant || '',
      t.description || '',
      t.pending ? 'Yes' : 'No'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export { router as transactionRouter };
