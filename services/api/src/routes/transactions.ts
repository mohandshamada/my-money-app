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
    const user_id = req.user!.id;
    const { startDate, endDate, category, limit = '10000', offset = '0' } = req.query;
    
    const where: any = { user_id };
    
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
    
    // Transform snake_case to camelCase for frontend
    const transformedTransactions = transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      isExpense: t.is_expense,
      merchant: t.merchant,
      description: t.description,
      date: t.date,
      category: t.category,
      subcategory: t.subcategory,
      pending: t.pending,
      isRecurring: t.is_recurring,
      tags: t.tags,
      currency: t.currency
    }));
    
    res.json({
      transactions: transformedTransactions,
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
    const user_id = req.user!.id;
    
    const transaction = await prisma.transactions.create({
      data: {
        amount: data.amount,
        is_expense: data.isExpense,
        merchant: data.merchant,
        description: data.description,
        date: new Date(data.date),
        category: data.category,
        subcategory: data.subcategory,
        tags: data.tags || [],
        pending: data.pending || false,
        user_id,
        updated_at: new Date()
      }
    });
    
    // Transform to camelCase for frontend
    res.status(201).json({
      id: transaction.id,
      amount: transaction.amount,
      isExpense: transaction.is_expense,
      merchant: transaction.merchant,
      description: transaction.description,
      date: transaction.date,
      category: transaction.category,
      subcategory: transaction.subcategory,
      pending: transaction.pending,
      isRecurring: transaction.is_recurring,
      tags: transaction.tags,
      currency: transaction.currency
    });
  } catch (error) {
    next(error);
  }
});

// Update transaction
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const data = transactionSchema.partial().parse(req.body);
    const user_id = req.user!.id;
    
    const transaction = await prisma.transactions.update({
      where: { id, user_id },
      data: { ...req.body as any,
        ...data,
        date: data.date ? new Date(data.date) : undefined
      }
    });
    
    // Transform to camelCase for frontend
    res.json({
      id: transaction.id,
      amount: transaction.amount,
      isExpense: transaction.is_expense,
      merchant: transaction.merchant,
      description: transaction.description,
      date: transaction.date,
      category: transaction.category,
      subcategory: transaction.subcategory,
      pending: transaction.pending,
      isRecurring: transaction.is_recurring,
      tags: transaction.tags,
      currency: transaction.currency
    });
  } catch (error) {
    next(error);
  }
});

// Bulk delete transactions
router.delete('/', async (req: any, res: any, next: any) => {
  try {
    const user_id = req.user!.id;
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No transaction IDs provided' });
    }
    
    const result = await prisma.transactions.deleteMany({
      where: { 
        id: { in: ids },
        user_id 
      }
    });
    
    res.json({ success: true, deletedCount: result.count });
  } catch (error) {
    next(error);
  }
});

// Delete transaction
router.delete('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const user_id = req.user!.id;
    
    await prisma.transactions.delete({
      where: { id, user_id }
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Import transactions (from parsed statements)
router.post('/import', async (req: any, res: any, next: any) => {
  try {
    const user_id = req.user!.id;
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions provided' });
    }
    
    let imported = 0;
    let duplicatesSkipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    
    // Get existing transactions to check for duplicates
    const existingTxns = await prisma.transactions.findMany({
      where: { user_id },
      select: { date: true, amount: true, description: true }
    });
    
    const existingSet = new Set(
      existingTxns.map(t => `${t.date.toISOString().split('T')[0]}|${t.amount}|${t.description}`)
    );
    
    console.log(`[Import] Starting import of ${transactions.length} transactions for user ${user_id}`);
    
    for (const tx of transactions) {
      try {
        // Skip if missing required fields
        if (!tx.date || tx.amount === undefined || tx.amount === null) {
          errors++;
          errorDetails.push(`Missing date or amount: ${JSON.stringify(tx)}`);
          console.log('[Import] Skipping transaction - missing date or amount:', tx);
          continue;
        }
        
        // Normalize date
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) {
          errors++;
          errorDetails.push(`Invalid date: ${tx.date}`);
          console.log('[Import] Skipping transaction - invalid date:', tx.date);
          continue;
        }
        
        // Check for duplicates
        const dateStr = txDate.toISOString().split('T')[0];
        const key = `${dateStr}|${Math.abs(parseFloat(tx.amount) || 0)}|${tx.description || ''}`;
        if (existingSet.has(key)) {
          duplicatesSkipped++;
          console.log('[Import] Skipping duplicate:', key);
          continue;
        }
        
        // Determine if expense based on type field or isExpense flag
        const isExpense = tx.type === 'debit' || tx.isExpense === true || tx.amount < 0;
        
        // Create transaction
        const created = await prisma.transactions.create({
          data: {
            user_id,
            amount: Math.abs(parseFloat(tx.amount) || 0),
            is_expense: isExpense,
            merchant: tx.merchant || tx.description?.substring(0, 50) || 'Unknown',
            description: tx.description || '',
            date: txDate,
            category: tx.category || 'Other',
            subcategory: tx.subcategory || null,
            pending: false,
            tags: [],
            currency: tx.currency || 'USD',
            updated_at: new Date()
          }
        });
        
        console.log(`[Import] Created transaction: ${created.id} - ${created.merchant} - $${created.amount}`);
        imported++;
        
        // Add to existing set to prevent duplicates within the same import batch
        existingSet.add(key);
      } catch (err: any) {
        errors++;
        errorDetails.push(err.message);
        console.error('[Import] Error creating transaction:', {
          error: err.message,
          code: err.code,
          meta: err.meta,
          transaction: tx
        });
      }
    }
    
    console.log(`[Import] Complete: ${imported} imported, ${duplicatesSkipped} duplicates skipped, ${errors} errors`);
    
    res.json({ 
      imported, 
      duplicatesSkipped, 
      errors,
      errorDetails: errors > 0 ? errorDetails.slice(0, 5) : undefined
    });
  } catch (error) {
    console.error('[Import] Fatal error:', error);
    next(error);
  }
});

// Export transactions as CSV
router.get('/export', async (req: any, res: any, next: any) => {
  try {
    const user_id = req.user!.id;
    const { startDate, endDate } = req.query;
    
    const where: any = { user_id };
    
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


// Find internal transfers automatically
router.get('/find-transfers', async (req: any, res: any, next: any) => {
  try {
    const user_id = req.user!.id;
    const transactions = await prisma.transactions.findMany({
      where: { 
        user_id,
        category: { notIn: ['Transfer', 'Internal Transfer'] }
      },
      orderBy: { date: 'asc' }
    });

    const expenses = transactions.filter((t: any) => t.is_expense);
    const incomes = transactions.filter((t: any) => !t.is_expense);

    let matchedPairs = [];
    let matchedIds = new Set();

    for (const exp of expenses) {
      if (matchedIds.has(exp.id)) continue;

      const match = incomes.find((inc: any) => {
        if (matchedIds.has(inc.id)) return false;
        if (Number(inc.amount) !== Number(exp.amount)) return false;

        const expDate = new Date(exp.date).getTime();
        const incDate = new Date(inc.date).getTime();
        const diffDays = Math.abs(expDate - incDate) / (1000 * 60 * 60 * 24);
        
        return diffDays <= 3;
      });

      if (match) {
        matchedIds.add(exp.id);
        matchedIds.add(match.id);
        matchedPairs.push({
          expense: {
            id: exp.id,
            amount: exp.amount,
            date: exp.date,
            merchant: exp.merchant,
            description: exp.description
          },
          income: {
            id: match.id,
            amount: match.amount,
            date: match.date,
            merchant: match.merchant,
            description: match.description
          },
          amount: Number(exp.amount),
          dateDiff: Math.abs(new Date(exp.date).getTime() - new Date(match.date).getTime()) / (1000 * 60 * 60 * 24)
        });
      }
    }

    res.json({ pairs: matchedPairs });
  } catch (error) {
    next(error);
  }
});

// Confirm internal transfers
router.post('/confirm-transfers', async (req: any, res: any, next: any) => {
  try {
    const user_id = req.user!.id;
    const { transactionIds } = req.body;
    
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'No transaction IDs provided' });
    }

    await prisma.transactions.updateMany({
      where: { 
        id: { in: transactionIds },
        user_id 
      },
      data: { category: 'Internal Transfer' }
    });

    res.json({ success: true, count: transactionIds.length });
  } catch (error) {
    next(error);
  }
});
export { router as transactionRouter };
