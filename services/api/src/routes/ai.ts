// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// AI Transaction Categorization
router.post('/categorize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchant, description, amount } = req.body;
    
    // Default categories if not provided
    const categories = req.body.categories || [
      { id: 'food', name: 'Food & Dining' },
      { id: 'groceries', name: 'Groceries' },
      { id: 'transport', name: 'Transportation' },
      { id: 'shopping', name: 'Shopping' },
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'bills', name: 'Bills & Utilities' },
      { id: 'health', name: 'Health & Fitness' },
      { id: 'travel', name: 'Travel' },
      { id: 'income', name: 'Income' },
      { id: 'other', name: 'Other' }
    ];

    if (!merchant && !description) {
      return res.status(400).json({ error: 'Merchant or description required' });
    }

    // Use GLM-5 for AI categorization
    const prompt = `You are a financial transaction categorization AI. 

Transaction Details:
- Merchant: ${merchant || 'Unknown'}
- Description: ${description || 'Unknown'}
- Amount: $${amount}

Available Categories:
${categories.map((c: any) => `- ${c.id}: ${c.name}`).join('\n')}

Analyze this transaction and respond with JSON in this exact format:
{
  "category": "category_id",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this category was chosen"
}

Rules:
1. Look for keywords in merchant/description
2. Consider amount size (large amounts often = bills/income)
3. Choose the most specific category possible
4. Confidence should reflect certainty (high for clear matches, low for ambiguous)`;

    // Call GLM-5 via OpenClaw API
    try {
      const aiResponse = await axios.post(
        'https://api.z.ai/api/coding/paas/v4/chat/completions',
        {
          model: 'glm-5',
          messages: [
            { role: 'system', content: 'You are a financial AI assistant. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = aiResponse.data.choices[0]?.message?.content || '';
      
      // Parse JSON from response
      let result;
      try {
        // Try to extract JSON if wrapped in markdown
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                          content.match(/```\n?([\s\S]*?)\n?```/) ||
                          [null, content];
        result = JSON.parse(jsonMatch[1] || content);
      } catch (parseError) {
        // Fallback to rule-based if AI response is invalid
        console.log('AI response parsing failed, using fallback:', content);
        result = fallbackCategorization(merchant, description, amount, categories);
      }

      res.json({
        category: result.category || 'other',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
        reasoning: result.reasoning || 'Categorized based on transaction patterns'
      });

    } catch (aiError) {
      // GLM-5 unavailable, use fallback
      console.log('GLM-5 unavailable, using rule-based fallback');
      const fallback = fallbackCategorization(merchant, description, amount, categories);
      res.json(fallback);
    }

  } catch (error) {
    next(error);
  }
});

// Fallback rule-based categorization
function fallbackCategorization(
  merchant: string, 
  description: string, 
  amount: number,
  categories: any[]
) {
  const text = `${merchant} ${description}`.toLowerCase();
  
  const keywordMap: Record<string, string> = {
    'restaurant': 'food', 'cafe': 'food', 'coffee': 'food', 'starbucks': 'food',
    'grocery': 'groceries', 'supermarket': 'groceries', 'walmart': 'groceries',
    'uber': 'transport', 'lyft': 'transport', 'gas': 'transport', 'shell': 'transport',
    'amazon': 'shopping', 'ebay': 'shopping', 'best buy': 'shopping',
    'netflix': 'entertainment', 'spotify': 'entertainment', 'hulu': 'entertainment',
    'electric': 'bills', 'water': 'bills', 'internet': 'bills', 'phone': 'bills',
    'gym': 'health', 'fitness': 'health', 'pharmacy': 'health', 'cvs': 'health',
    'airline': 'travel', 'hotel': 'travel', 'booking': 'travel', 'airbnb': 'travel',
    'tuition': 'education', 'course': 'education', 'book': 'education',
    'salary': 'income', 'paycheck': 'income', 'deposit': 'income'
  };

  for (const [keyword, categoryId] of Object.entries(keywordMap)) {
    if (text.includes(keyword)) {
      const category = categories.find((c: any) => c.id === categoryId);
      return {
        category: categoryId,
        confidence: 0.7,
        reasoning: `Matched keyword "${keyword}" in transaction details`
      };
    }
  }

  // Large amounts often indicate bills or income
  if (amount > 1000) {
    return {
      category: amount > 0 ? 'bills' : 'income',
      confidence: 0.4,
      reasoning: 'Large amount suggests recurring bill or income'
    };
  }

  return {
    category: 'other',
    confidence: 0.2,
    reasoning: 'Could not determine category from available information'
  };
}

// AI Insights endpoint
router.post('/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactions, timeframe } = req.body;

    const prompt = `Analyze these financial transactions and provide insights:

Timeframe: ${timeframe}
Transactions: ${JSON.stringify(transactions.slice(0, 20))}

Provide a JSON response with:
{
  "summary": "Brief overview of spending patterns",
  "anomalies": ["List unusual spending patterns"],
  "recommendations": ["Actionable savings tips"],
  "trends": {
    "increasing": ["Categories spending more"],
    "decreasing": ["Categories spending less"]
  }
}`;

    try {
      const aiResponse = await axios.post(
        'https://api.z.ai/api/coding/paas/v4/chat/completions',
        {
          model: 'glm-5',
          messages: [
            { role: 'system', content: 'You are a financial advisor AI.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = aiResponse.data.choices[0]?.message?.content || '';
      
      let insights;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                          content.match(/```\n?([\s\S]*?)\n?```/) ||
                          [null, content];
        insights = JSON.parse(jsonMatch[1] || content);
      } catch (parseError) {
        insights = {
          summary: 'Unable to generate insights at this time.',
          anomalies: [],
          recommendations: ['Review your spending manually'],
          trends: { increasing: [], decreasing: [] }
        };
      }

      res.json(insights);

    } catch (aiError) {
      res.json({
        summary: `Analyzed ${transactions.length} transactions`,
        anomalies: [],
        recommendations: ['Try uploading more transactions for better insights'],
        trends: { increasing: [], decreasing: [] }
      });
    }

  } catch (error) {
    next(error);
  }
});

// Natural Language Query endpoint
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, transactions } = req.body;

    const prompt = `Answer this financial question based on transaction data:

Question: "${query}"

Recent Transactions: ${JSON.stringify(transactions.slice(0, 50))}

Respond with JSON:
{
  "answer": "Direct answer to the question",
  "sql_equivalent": "What SQL query would answer this",
  "related_transactions": ["List relevant transaction IDs if applicable"]
}`;

    try {
      const aiResponse = await axios.post(
        'https://api.z.ai/api/coding/paas/v4/chat/completions',
        {
          model: 'glm-5',
          messages: [
            { role: 'system', content: 'You are a financial data assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 400
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = aiResponse.data.choices[0]?.message?.content || '';
      
      let result;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                          content.match(/```\n?([\s\S]*?)\n?```/) ||
                          [null, content];
        result = JSON.parse(jsonMatch[1] || content);
      } catch (parseError) {
        result = {
          answer: 'I could not process that query. Try asking about spending by category or specific time periods.',
          sql_equivalent: 'N/A',
          related_transactions: []
        };
      }

      res.json(result);

    } catch (aiError) {
      res.json({
        answer: 'AI service temporarily unavailable. Please try again later.',
        sql_equivalent: 'N/A',
        related_transactions: []
      });
    }

  } catch (error) {
    next(error);
  }
});

// Receipt OCR endpoint
router.post('/scan-receipt', async (req: any, res: any, next: any) => {
  try {
    // In production, use Google Vision API, AWS Textract, or Tesseract.js
    // For demo, return mock data
    res.json({
      merchant: 'Whole Foods Market',
      amount: 67.43,
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: 'Organic Bananas', price: 2.99 },
        { name: 'Almond Milk', price: 4.49 },
        { name: 'Chicken Breast', price: 12.99 }
      ],
      category: 'groceries',
      confidence: 0.92
    });
  } catch (error) {
    next(error);
  }
});export { router as aiRouter };
