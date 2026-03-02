// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get spending alerts for user
router.get('/spending-alerts', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();
    const monthProgress = now.getDate() / daysInMonth;

    // Get all budgets
    const budgets = await prisma.budgets.findMany({
      where: {
        user_id: userId,
        start_date: { lte: now },
        OR: [
          { end_date: null },
          { end_date: { gte: now } }
        ]
      }
    });

    // Get spending by category this month
    const transactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        is_expense: true,
        date: { gte: startOfMonth }
      }
    });

    const spendingByCategory = transactions.reduce((acc, t) => {
      const cat = t.category || 'other';
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    // Generate alerts
    const alerts = [];

    for (const budget of budgets) {
      const spent = spendingByCategory[budget.category] || 0;
      const budgetAmount = Number(budget.amount);
      const percentUsed = (spent / budgetAmount) * 100;

      // Alert if spending ahead of time
      if (percentUsed > monthProgress * 100 + 10) {
        alerts.push({
          type: 'overspending',
          severity: percentUsed > 90 ? 'high' : percentUsed > 75 ? 'medium' : 'low',
          category: budget.category,
          budget: budgetAmount,
          spent,
          percentUsed: Math.round(percentUsed),
          daysRemaining,
          message: `You've spent ${Math.round(percentUsed)}% of your ${budget.category} budget with ${daysRemaining} days remaining`,
          recommendation: percentUsed > 90 
            ? 'Consider reducing spending in this category'
            : 'Slow down to stay on track'
        });
      }

      // Alert if over budget
      if (spent > budgetAmount) {
        alerts.push({
          type: 'over_budget',
          severity: 'high',
          category: budget.category,
          budget: budgetAmount,
          spent,
          overBy: spent - budgetAmount,
          message: `Over budget by $${(spent - budgetAmount).toFixed(2)} in ${budget.category}`,
          recommendation: 'Review recent transactions in this category'
        });
      }
    }

    // Check for bill increases (compare to last 3 months avg)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastThreeMonths = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        is_expense: true,
        date: { gte: threeMonthsAgo, lt: startOfMonth }
      }
    });

    const avgByCategory = lastThreeMonths.reduce((acc, t) => {
      const cat = t.category || 'other';
      if (!acc[cat]) acc[cat] = { sum: 0, count: 0 };
      acc[cat].sum += Number(t.amount);
      acc[cat].count++;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    for (const [category, data] of Object.entries(avgByCategory)) {
      const avg = data.sum / 3; // 3 months average
      const current = spendingByCategory[category] || 0;
      const currentProjected = current * (daysInMonth / now.getDate()); // Project to end of month
      
      if (currentProjected > avg * 1.15 && currentProjected > 50) { // 15% increase and >$50
        alerts.push({
          type: 'bill_increase',
          severity: 'medium',
          category,
          avgMonthly: avg,
          projectedMonth: currentProjected,
          percentIncrease: Math.round((currentProjected / avg - 1) * 100),
          message: `Your ${category} spending is trending ${Math.round((currentProjected / avg - 1) * 100)}% higher than usual`,
          recommendation: 'Check for rate increases or consider alternatives'
        });
      }
    }

    res.json({ alerts, summary: { total: alerts.length, high: alerts.filter(a => a.severity === 'high').length } });
  } catch (error) {
    next(error);
  }
});

// Get net worth
router.get('/net-worth', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get all transactions (income - expenses = net flow)
    const transactions = await prisma.transactions.findMany({
      where: { user_id: userId }
    });

    // Get bank accounts
    const accounts = await prisma.bank_accounts.findMany({
      where: { user_id: userId, include_in_net_worth: true }
    });

    // Calculate cash flow
    const totalIncome = transactions
      .filter(t => !t.is_expense)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.is_expense)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Bank balances
    const bankBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    // Simple net worth (would need assets/liabilities tables for full picture)
    const netWorth = bankBalance + (totalIncome - totalExpenses);

    // Calculate 6-month trend
    const now = new Date();
    const trend = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTx = transactions.filter(t => 
        new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
      );

      const monthIncome = monthTx.filter(t => !t.is_expense).reduce((s, t) => s + Number(t.amount), 0);
      const monthExpenses = monthTx.filter(t => t.is_expense).reduce((s, t) => s + Number(t.amount), 0);

      trend.push({
        month: monthStart.toISOString().slice(0, 7),
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses
      });
    }

    res.json({ netWorth, bankBalance, cashFlow: totalIncome - totalExpenses, trend });
  } catch (error) {
    next(error);
  }
});

// Year-over-year comparison
router.get('/yoy-comparison', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

    // This month
    const thisMonth = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        date: { gte: thisMonthStart }
      }
    });

    // Same month last year
    const lastYear = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        date: { gte: lastYearStart, lte: lastYearEnd }
      }
    });

    const summarize = (txs: any[]) => {
      const income = txs.filter(t => !t.is_expense).reduce((s, t) => s + Number(t.amount), 0);
      const expenses = txs.filter(t => t.is_expense).reduce((s, t) => s + Number(t.amount), 0);
      
      const byCategory = txs.filter(t => t.is_expense).reduce((acc, t) => {
        const cat = t.category || 'other';
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

      return { income, expenses, net: income - expenses, byCategory };
    };

    const thisMonthData = summarize(thisMonth);
    const lastYearData = summarize(lastYear);

    // Calculate changes
    const changes = {
      income: { 
        amount: thisMonthData.income - lastYearData.income,
        percent: lastYearData.income > 0 
          ? Math.round((thisMonthData.income / lastYearData.income - 1) * 100) 
          : 0
      },
      expenses: {
        amount: thisMonthData.expenses - lastYearData.expenses,
        percent: lastYearData.expenses > 0
          ? Math.round((thisMonthData.expenses / lastYearData.expenses - 1) * 100)
          : 0
      },
      net: {
        amount: thisMonthData.net - lastYearData.net,
        percent: lastYearData.net !== 0
          ? Math.round((thisMonthData.net / Math.abs(lastYearData.net) - 1) * 100)
          : 0
      }
    };

    // Category changes
    const allCategories = new Set([
      ...Object.keys(thisMonthData.byCategory),
      ...Object.keys(lastYearData.byCategory)
    ]);

    const categoryChanges = Array.from(allCategories).map(cat => ({
      category: cat,
      thisYear: thisMonthData.byCategory[cat] || 0,
      lastYear: lastYearData.byCategory[cat] || 0,
      change: (thisMonthData.byCategory[cat] || 0) - (lastYearData.byCategory[cat] || 0),
      percentChange: lastYearData.byCategory[cat] > 0
        ? Math.round(((thisMonthData.byCategory[cat] || 0) / lastYearData.byCategory[cat] - 1) * 100)
        : 0
    })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    res.json({
      thisMonth: { 
        month: thisMonthStart.toISOString().slice(0, 7),
        ...thisMonthData 
      },
      lastYear: {
        month: lastYearStart.toISOString().slice(0, 7),
        ...lastYearData
      },
      changes,
      categoryChanges
    });
  } catch (error) {
    next(error);
  }
});

export { router as alertsRouter };
