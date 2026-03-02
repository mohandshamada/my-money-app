import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all rules for user
router.get('/', authMiddleware as any, async (req: any, res: any) => {
  try {
    const rules = await prisma.categorization_rules.findMany({
      where: { user_id: req.user.id },
      orderBy: { priority: 'desc' }
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Create new rule
router.post('/', authMiddleware as any, async (req: any, res: any) => {
  try {
    const { match_field, match_type, match_value, category, subcategory, priority } = req.body;
    const rule = await prisma.categorization_rules.create({
      data: {
        user_id: req.user.id,
        match_field,
        match_type,
        match_value,
        category,
        subcategory,
        priority: priority || 0
      }
    });
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: 'Invalid rule data' });
  }
});

// Delete rule
router.delete('/:id', authMiddleware as any, async (req: any, res: any) => {
  try {
    await prisma.categorization_rules.deleteMany({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});


// Apply rules to existing transactions
router.post('/apply', authMiddleware as any, async (req: any, res: any) => {
  try {
    const user_id = req.user.id;
    
    // Get all rules for the user, ordered by priority
    const rules = await prisma.categorization_rules.findMany({
      where: { user_id },
      orderBy: { priority: 'desc' }
    });
    
    if (rules.length === 0) {
      return res.json({ updatedCount: 0, message: 'No rules to apply' });
    }

    // Get all transactions for the user
    const transactions = await prisma.transactions.findMany({
      where: { user_id }
    });

    let updatedCount = 0;
    const updates = [];

    // Evaluate each transaction against rules
    for (const tx of transactions) {
      let matchedRule = null;
      
      for (const rule of rules) {
        const field_value = rule.match_field === 'merchant' ? tx.merchant : tx.description;
        if (!field_value) continue;
        
        const valueLower = field_value.toLowerCase();
        const ruleValueLower = rule.match_value.toLowerCase();
        
        let isMatch = false;
        if (rule.match_type === 'contains' && valueLower.includes(ruleValueLower)) isMatch = true;
        else if (rule.match_type === 'exact' && valueLower === ruleValueLower) isMatch = true;
        else if (rule.match_type === 'starts_with' && valueLower.startsWith(ruleValueLower)) isMatch = true;
        
        if (isMatch) {
          matchedRule = rule;
          break; // Highest priority rule matches first
        }
      }
      
      // If a rule matched and the category/subcategory is different, update it
      if (matchedRule) {
        if (tx.category !== matchedRule.category || (matchedRule.subcategory && tx.subcategory !== matchedRule.subcategory)) {
          updates.push(
            prisma.transactions.update({
              where: { id: tx.id },
              data: {
                category: matchedRule.category,
                subcategory: matchedRule.subcategory || tx.subcategory
              }
            })
          );
          updatedCount++;
        }
      }
    }
    
    // Execute all updates
    if (updates.length > 0) {
      // Execute in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        await prisma.$transaction(updates.slice(i, i + batchSize));
      }
    }

    res.json({ updatedCount, message: `Successfully updated ${updatedCount} transactions` });
  } catch (error) {
    console.error('Failed to apply rules:', error);
    res.status(500).json({ error: 'Failed to apply rules' });
  }
});

export default router;
