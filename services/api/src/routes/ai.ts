// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { getUserAIConfig, generateInsightsWithAI } from '../services/aiProviders';

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

// AI Insights endpoint - uses user's configured AI provider or local fallback
router.post('/insights', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactions, timeframe } = req.body;
    const userId = req.user?.id;
    
    console.log('Insights request:', {
      userId,
      transactionCount: transactions?.length,
      timeframe
    });
    
    if (!transactions || transactions.length === 0) {
      return res.json({
        summary: 'No transactions available to analyze. Add some transactions to see insights.',
        anomalies: [],
        recommendations: ['Start by adding your income and expenses'],
        trends: { increasing: [], decreasing: [] }
      });
    }

    // Try user's configured AI provider first
    if (userId) {
      const userAIConfig = await getUserAIConfig(userId);
      
      if (userAIConfig) {
        try {
          console.log(`Using user's AI provider: ${userAIConfig.provider}`);
          const aiInsights = await generateInsightsWithAI(userAIConfig, transactions, timeframe);
          console.log('AI insights generated successfully');
          return res.json(aiInsights);
        } catch (aiError) {
          console.log('User AI provider failed:', aiError.message);
          // Fall through to fallback
        }
      }
    }
    
    // Try environment GLM-5 as fallback
    const apiKey = process.env.ZAI_API_KEY || process.env.GLM5_API_KEY;
    if (apiKey) {
      try {
        console.log('Trying fallback GLM-5...');
        const glmInsights = await generateGLM5Insights(transactions, timeframe, apiKey);
        return res.json(glmInsights);
      } catch (aiError) {
        console.log('Fallback GLM-5 failed:', aiError.message);
      }
    }

    // Generate local insights as final fallback
    console.log('Using local insights...');
    const insights = generateLocalInsights(transactions, timeframe);
    res.json(insights);

  } catch (error) {
    next(error);
  }
});

// GLM-5 insights generator
async function generateGLM5Insights(transactions: any[], timeframe: string, apiKey: string) {
  // Normalize transaction data before sending to GLM-5
  const normalizedTransactions = transactions.map((t: any) => {
    let amount = 0;
    if (t.amount !== undefined && t.amount !== null) {
      amount = typeof t.amount === 'number' ? t.amount : 
               typeof t.amount === 'string' ? parseFloat(t.amount) :
               parseFloat(t.amount.toString?.() || '0');
    }
    
    const isExpense = t.is_expense === true || 
                     t.isExpense === true || 
                     t.type === 'expense' ||
                     t.type === 'debit' ||
                     (t.amount && parseFloat(t.amount.toString()) < 0);
    
    return {
      amount: Math.abs(amount),
      isExpense,
      category: t.category || 'Uncategorized',
      merchant: t.merchant || t.description || 'Unknown',
      date: t.date
    };
  }).slice(0, 50);

  const prompt = `Analyze these financial transactions and provide insights:

Timeframe: ${timeframe}
Transactions: ${JSON.stringify(normalizedTransactions)}

Provide a JSON response with:
{
  "summary": "Brief overview of spending patterns with specific dollar amounts",
  "anomalies": ["List unusual spending patterns or large transactions with amounts"],
  "recommendations": ["Actionable savings tips based on the actual data"],
  "trends": {
    "increasing": ["Categories where spending is high"],
    "decreasing": []
  }
}

Important: Reference actual dollar amounts from the data. If expenses exceed income, mention by how much. If they saved money, say how much.`;

  const response = await axios.post(
    'https://api.z.ai/api/coding/paas/v4/chat/completions',
    {
      model: 'glm-5',
      messages: [
        { role: 'system', content: 'You are a financial advisor AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const content = response.data.choices[0]?.message?.content || '';
  
  let insights;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    insights = JSON.parse(jsonMatch[1] || content);
  } catch (parseError) {
    throw new Error('Failed to parse AI response');
  }

  return {
    summary: insights.summary || 'Analysis completed',
    anomalies: insights.anomalies || [],
    recommendations: insights.recommendations || [],
    trends: insights.trends || { increasing: [], decreasing: [] },
    aiGenerated: true
  };
}

// Local insights generator (no API needed)
function generateLocalInsights(transactions: any[], timeframe: string) {
  console.log('Generating local insights for', transactions.length, 'transactions, timeframe:', timeframe);
  
  // Determine if we should filter by date based on timeframe
  const isAllTime = timeframe.toLowerCase().includes('all');
  
  let filteredTxns = transactions;
  
  if (!isAllTime) {
    // Apply date filtering only if not "all time"
    const now = new Date();
    let cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days
    
    if (timeframe.includes('90')) {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    
    console.log('Date filter: now =', now.toISOString(), ', cutoff =', cutoffDate.toISOString());
    
    filteredTxns = transactions.filter((t: any) => {
      const date = new Date(t.date);
      const isRecent = date >= cutoffDate;
      if (!isRecent) {
        console.log('Filtering out (too old):', t.date);
      }
      return isRecent;
    });
  } else {
    console.log('All time selected - using all transactions');
  }
  
  // Normalize transaction data
  const recentTxns = filteredTxns.map((t: any) => {
    // Parse amount - handle different formats (Decimal, string, number)
    let amount = 0;
    if (t.amount !== undefined && t.amount !== null) {
      amount = typeof t.amount === 'number' ? t.amount : 
               typeof t.amount === 'string' ? parseFloat(t.amount) :
               parseFloat(t.amount.toString?.() || '0');
    }
    
    // Determine if expense - check multiple possible field names
    const isExpense = t.is_expense === true || 
                     t.isExpense === true || 
                     t.type === 'expense' ||
                     t.type === 'debit' ||
                     (t.amount && parseFloat(t.amount.toString()) < 0);
    
    return {
      ...t,
      amount: Math.abs(amount), // Always positive
      isExpense
    };
  });
  
  console.log('Transactions processed:', recentTxns.length);
  
  // Calculate totals
  const expenses = recentTxns.filter((t: any) => t.isExpense);
  const income = recentTxns.filter((t: any) => !t.isExpense);
  
  const totalExpenses = expenses.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const totalIncome = income.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const netSavings = totalIncome - totalExpenses;
  
  console.log('Calculated:', { totalIncome, totalExpenses, netSavings });
  
  // Group by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((t: any) => {
    const cat = t.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
  });
  
  // Find top spending categories
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Find large transactions (anomalies)
  const avgExpense = totalExpenses / (expenses.length || 1);
  const largeTransactions = expenses
    .filter((t: any) => (t.amount || 0) > avgExpense * 3 && (t.amount || 0) > 100)
    .slice(0, 3);
  
  // Format currency helper
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Generate summary based on timeframe
  let summary = '';
  const periodLabel = isAllTime ? 'all time' : (timeframe.includes('90') ? 'last 90 days' : 'last 30 days');
  
  if (recentTxns.length === 0) {
    summary = `No transactions found for ${periodLabel}. Add some transactions to see insights!`;
  } else if (netSavings > 0) {
    summary = `Great job! You saved ${fmt(netSavings)} in ${periodLabel}. Total income: ${fmt(totalIncome)}, Total expenses: ${fmt(totalExpenses)}.`;
  } else if (netSavings < 0) {
    summary = `You spent ${fmt(Math.abs(netSavings))} more than you earned in ${periodLabel}. Total income: ${fmt(totalIncome)}, Total expenses: ${fmt(totalExpenses)}.`;
  } else {
    summary = `You broke even in ${periodLabel}! Total income and expenses were both ${fmt(totalIncome)}.`;
  }
  
  // Generate anomalies
  const anomalies: string[] = [];
  if (largeTransactions.length > 0) {
    largeTransactions.forEach((t: any) => {
      anomalies.push(`Large expense: ${t.merchant || t.category || 'Unknown'} (${fmt(t.amount || 0)})`);
    });
  }
  if (totalExpenses > totalIncome * 1.5 && totalIncome > 0) {
    anomalies.push('Spending significantly exceeds income');
  }
  if (anomalies.length === 0) {
    anomalies.push('No unusual spending patterns detected');
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (netSavings < 0) {
    recommendations.push('Your expenses exceed income. Review your spending habits and cut unnecessary costs.');
  }
  if (sortedCategories.length > 0 && sortedCategories[0][1] > 0) {
    recommendations.push(`Your biggest expense is ${sortedCategories[0][0]} (${fmt(sortedCategories[0][1])}). Consider reducing spending here.`);
  }
  if (expenses.length > 20) {
    recommendations.push('You have many small transactions. Consider using a budget to control daily spending.');
  }
  if (totalIncome === 0 && totalExpenses > 0) {
    recommendations.push('No income recorded. Make sure to add your salary and other income sources.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep tracking your transactions for better insights!');
  }
  
  // Generate trends
  const trends = {
    increasing: sortedCategories.slice(0, 2).map(([cat]) => cat),
    decreasing: []
  };
  
  return {
    summary,
    anomalies,
    recommendations,
    trends,
    stats: {
      totalTransactions: transactions.length,
      recentTransactions: recentTxns.length,
      totalIncome,
      totalExpenses,
      netSavings,
      topCategory: sortedCategories[0]?.[0] || 'None'
    }
  };
}

// Natural Language Query endpoint
router.post('/query', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query, transactions } = req.body;
    const userId = req.user?.id;

    // Try user's configured AI provider first
    let result: any = null;
    let usedAI = false;
    
    if (userId) {
      const userAIConfig = await getUserAIConfig(userId);
      
      if (userAIConfig) {
        try {
          const prompt = `Answer this financial question based on transaction data:

Question: "${query}"

Transactions: ${JSON.stringify(transactions.slice(0, 50))}

Respond with JSON:
{
  "answer": "Direct answer to the question with specific numbers",
  "sql_equivalent": "What SQL query would answer this",
  "related_transactions": ["List relevant transaction IDs if applicable"]
}`;

          const aiResponse = await generateInsightsWithAI(userAIConfig, [], '');
          // Reuse the axios call for query
          const response = await axios.post(
            userAIConfig.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
            userAIConfig.provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' :
            userAIConfig.provider === 'kimi' ? 'https://api.moonshot.cn/v1/chat/completions' :
            'https://api.z.ai/api/coding/paas/v4/chat/completions',
            {
              model: userAIConfig.model || 'glm-5',
              messages: [
                { role: 'system', content: 'You are a financial data assistant. Respond only with valid JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 400
            },
            {
              headers: {
                'Authorization': `Bearer ${userAIConfig.apiKey}`,
                'Content-Type': 'application/json',
                ...(userAIConfig.provider === 'openrouter' ? {
                  'HTTP-Referer': 'https://mymoney.mshousha.uk',
                  'X-Title': 'My Money AI'
                } : {})
              },
              timeout: 30000
            }
          );

          const content = response.data.choices[0]?.message?.content;
          if (content) {
            try {
              const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                                content.match(/```\n?([\s\S]*?)\n?```/) ||
                                [null, content];
              result = JSON.parse(jsonMatch[1] || content);
              usedAI = true;
            } catch (e) {
              console.log('Failed to parse AI response, using local fallback');
            }
          }
        } catch (aiError) {
          console.log('User AI provider failed for query:', aiError.message);
        }
      }
    }
    
    // Try environment key as fallback
    if (!result && process.env.ZAI_API_KEY) {
      try {
        const prompt = `Answer this financial question based on transaction data:

Question: "${query}"

Transactions: ${JSON.stringify(transactions.slice(0, 50))}

Respond with JSON:
{
  "answer": "Direct answer to the question with specific numbers",
  "sql_equivalent": "What SQL query would answer this",
  "related_transactions": ["List relevant transaction IDs if applicable"]
}`;

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
            },
            timeout: 30000
          }
        );

        const content = aiResponse.data.choices[0]?.message?.content;
        if (content) {
          try {
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                              content.match(/```\n?([\s\S]*?)\n?```/) ||
                              [null, content];
            result = JSON.parse(jsonMatch[1] || content);
            usedAI = true;
          } catch (e) {
            console.log('Failed to parse env AI response, using local fallback');
          }
        }
      } catch (aiError) {
        console.log('Environment AI failed for query:', aiError.message);
      }
    }

    // Local fallback if AI failed or no API key
    if (!result) {
      result = processQueryLocally(query, transactions);
    }

    res.json(result);

  } catch (error) {
    next(error);
  }
});

// Local query processing fallback
function processQueryLocally(query: string, transactions: any[]): any {
  const lowerQuery = query.toLowerCase();
  
  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  const expenses = transactions.filter(t => t.isExpense || t.is_expense);
  
  expenses.forEach(t => {
    const cat = t.category || 'Uncategorized';
    const amount = parseFloat(t.amount?.toString() || '0');
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
  });
  
  // Find biggest expense category
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);
  
  // Food spending
  const foodCategories = ['food', 'dining', 'groceries', 'restaurant'];
  const foodSpending = expenses
    .filter(t => foodCategories.some(fc => (t.category || '').toLowerCase().includes(fc)))
    .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
  
  // Uber transactions
  const uberTransactions = transactions.filter(t => 
    (t.merchant || '').toLowerCase().includes('uber')
  );
  
  // Income vs Expenses
  const totalIncome = transactions
    .filter(t => !(t.isExpense || t.is_expense))
    .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
  
  const totalExpenses = expenses
    .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
  
  const savings = totalIncome - totalExpenses;
  
  // Generate answer based on query type
  let answer = '';
  
  if (lowerQuery.includes('biggest') || lowerQuery.includes('largest') || lowerQuery.includes('most')) {
    if (sortedCategories.length > 0) {
      const [cat, amount] = sortedCategories[0];
      answer = `Your biggest expense category is **${cat}** with **$${amount.toFixed(2)}** spent.`;
    } else {
      answer = 'No expense data available to determine your biggest category.';
    }
  } else if (lowerQuery.includes('food')) {
    if (foodSpending > 0) {
      answer = `You spent **$${foodSpending.toFixed(2)}** on food-related purchases.`;
    } else {
      answer = 'No food-related expenses found in your transactions.';
    }
  } else if (lowerQuery.includes('uber')) {
    if (uberTransactions.length > 0) {
      const uberTotal = uberTransactions.reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
      answer = `You have **${uberTransactions.length}** Uber transactions totaling **$${uberTotal.toFixed(2)}**.`;
    } else {
      answer = 'No Uber transactions found.';
    }
  } else if (lowerQuery.includes('saved') || lowerQuery.includes('savings')) {
    if (savings > 0) {
      answer = `You've saved **$${savings.toFixed(2)}** (Income: $${totalIncome.toFixed(2)} - Expenses: $${totalExpenses.toFixed(2)}).`;
    } else if (savings < 0) {
      answer = `You've spent **$${Math.abs(savings).toFixed(2)}** more than you earned.`;
    } else {
      answer = 'You broke even with equal income and expenses.';
    }
  } else {
    // General summary
    answer = `You have **${transactions.length}** transactions. `;
    if (sortedCategories.length > 0) {
      answer += `Your biggest expense category is **${sortedCategories[0][0]}** ($${sortedCategories[0][1].toFixed(2)}). `;
    }
    if (savings >= 0) {
      answer += `You've saved $${savings.toFixed(2)}.`;
    } else {
      answer += `You've overspent by $${Math.abs(savings).toFixed(2)}.`;
    }
  }
  
  return {
    answer,
    sql_equivalent: 'SELECT * FROM transactions WHERE...',
    related_transactions: [],
    localProcessing: true
  };
}

// Receipt OCR endpoint
router.post('/scan-receipt', async (req: any, res: any, next: any) => {
  try {
    const { image } = req.body; // Base64 encoded image
    
    if (!image) {
      return res.status(400).json({ error: 'Image required' });
    }

    // Use GLM-5 Vision or DeepSeek Vision for OCR
    const visionPrompt = `Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "Store name",
  "amount": total_amount_as_number,
  "date": "YYYY-MM-DD",
  "items": [{"name": "item name", "price": price_as_number}],
  "category": "category_id",
  "confidence": 0.0-1.0
}

Categories: groceries, food, shopping, gas, entertainment, bills, health, travel, other

Look for:
- Store name/logo
- Total amount (usually at bottom)
- Date
- Individual line items

If you can't read something clearly, set confidence lower. Respond ONLY with valid JSON.`;

    // Try GLM-5 Vision API first
    const glm5ApiKey = process.env.GLM5_API_KEY;
    
    if (glm5ApiKey) {
      try {
        const visionResponse = await axios.post(
          'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          {
            model: 'glm-4v-plus',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: visionPrompt },
                { type: 'image_url', image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` } }
              ]
            }],
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${glm5ApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const content = visionResponse.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json(parsed);
        }
      } catch (glmError) {
        console.error('GLM-5 Vision failed:', glmError.response?.data || glmError.message);
      }
    }

    // Fallback to mock data if no vision API available
    res.json({
      merchant: 'Receipt Scanned',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      items: [],
      category: 'other',
      confidence: 0.5,
      note: 'Vision API not configured. Add GLM5_API_KEY for real OCR.'
    });
  } catch (error) {
    next(error);
  }
});

// Conversational Chat endpoint
router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, conversationHistory } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch all user's transactions from database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const transactions = await prisma.transactions.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      take: 500 // Limit to recent 500 transactions for performance
    });

    // Fetch user settings for context
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { currency: true, email: true }
    });

    // Get user's AI configuration
    const settings = await prisma.user_settings.findUnique({
      where: { user_id: userId }
    });

    // Build system prompt with all user data
    const systemPrompt = `You are an AI Finance Assistant for My Money app. You have complete access to the user's financial data.

USER CONTEXT:
- Currency: ${user?.currency || 'USD'}
- Total Transactions: ${transactions.length}
- Date Range: ${transactions.length > 0 ? new Date(transactions[transactions.length - 1].date).toLocaleDateString() : 'N/A'} to ${transactions.length > 0 ? new Date(transactions[0].date).toLocaleDateString() : 'N/A'}

TRANSACTION DATA (last ${transactions.length} transactions):
${JSON.stringify(transactions.slice(0, 100).map(t => ({
  date: new Date(t.date).toISOString().split('T')[0],
  merchant: t.merchant,
  category: t.category,
  amount: t.amount.toString(),
  isExpense: t.is_expense,
  currency: t.currency
})), null, 2)}

You can help with:
- Analyzing spending patterns and trends
- Answering questions about specific transactions
- Providing insights on categories
- Calculating totals and averages
- Comparing time periods
- Identifying unusual spending
- Suggesting budget improvements

Respond conversationally and helpfully. Use specific numbers from the data when relevant. If you don't have enough information, ask clarifying questions.`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    let response = '';

    // Try user's configured AI provider
    if (settings?.ai_enabled && settings.ai_api_key) {
      try {
        const { decrypt } = await import('../services/aiProviders');
        const apiKey = decrypt(settings.ai_api_key);
        
        const endpoint = settings.ai_provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
                        settings.ai_provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' :
                        settings.ai_provider === 'kimi' ? 'https://api.moonshot.cn/v1/chat/completions' :
                        'https://api.z.ai/api/coding/paas/v4/chat/completions';

        const aiResponse = await axios.post(
          endpoint,
          {
            model: settings.ai_model || 'glm-5',
            messages,
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              ...(settings.ai_provider === 'openrouter' ? {
                'HTTP-Referer': 'https://mymoney.mshousha.uk',
                'X-Title': 'My Money AI'
              } : {})
            },
            timeout: 60000
          }
        );

        response = aiResponse.data.choices[0]?.message?.content || '';
      } catch (aiError) {
        console.log('User AI failed for chat:', aiError.message);
      }
    }

    // Try environment key as fallback
    if (!response && process.env.ZAI_API_KEY) {
      try {
        const aiResponse = await axios.post(
          'https://api.z.ai/api/coding/paas/v4/chat/completions',
          {
            model: 'glm-5',
            messages,
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        response = aiResponse.data.choices[0]?.message?.content || '';
      } catch (aiError) {
        console.log('Environment AI failed for chat:', aiError.message);
      }
    }

    // Local fallback if no AI available
    if (!response) {
      response = generateLocalChatResponse(message, transactions);
    }

    res.json({ response });

  } catch (error) {
    next(error);
  }
});

// Local chat response generator (fallback when AI is unavailable)
function generateLocalChatResponse(message: string, transactions: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Calculate stats
  const expenses = transactions.filter(t => t.is_expense);
  const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
  const totalIncome = transactions
    .filter(t => !t.is_expense)
    .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
  
  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(t => {
    const cat = t.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount?.toString() || '0');
  });
  
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  
  // Generate response based on query type
  if (lowerMessage.includes('total') || lowerMessage.includes('spent') || lowerMessage.includes('spend')) {
    if (lowerMessage.includes('category') || lowerMessage.includes('on')) {
      // Find specific category
      const category = sortedCategories.find(([cat]) => 
        lowerMessage.includes(cat.toLowerCase())
      );
      if (category) {
        return `You spent **$${category[1].toFixed(2)}** on ${category[0]} across ${expenses.filter(t => t.category === category[0]).length} transactions.`;
      }
    }
    return `Your total expenses are **$${totalExpenses.toFixed(2)}** across ${expenses.length} transactions.`;
  }
  
  if (lowerMessage.includes('biggest') || lowerMessage.includes('top') || lowerMessage.includes('most')) {
    if (sortedCategories.length > 0) {
      return `Your biggest expense category is **${sortedCategories[0][0]}** with **$${sortedCategories[0][1].toFixed(2)}** spent.`;
    }
    return "I don't see any expense data to analyze.";
  }
  
  if (lowerMessage.includes('income')) {
    return `Your total income is **$${totalIncome.toFixed(2)}** from ${transactions.filter(t => !t.is_expense).length} transactions.`;
  }
  
  if (lowerMessage.includes('save') || lowerMessage.includes('savings')) {
    const savings = totalIncome - totalExpenses;
    if (savings > 0) {
      return `Great job! You've saved **$${savings.toFixed(2)}** (Income $${totalIncome.toFixed(2)} - Expenses $${totalExpenses.toFixed(2)}).`;
    } else {
      return `You've spent **$${Math.abs(savings).toFixed(2)}** more than you earned.`;
    }
  }
  
  if (lowerMessage.includes('transaction') || lowerMessage.includes('transactions')) {
    return `You have **${transactions.length}** total transactions (${expenses.length} expenses, ${transactions.filter(t => !t.is_expense).length} income).`;
  }
  
  if (lowerMessage.includes('category') || lowerMessage.includes('categories')) {
    const categoryList = sortedCategories.slice(0, 5).map(([cat, amount]) => 
      `- ${cat}: $${amount.toFixed(2)}`
    ).join('\n');
    return `Here are your top spending categories:\n${categoryList}`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI Finance Assistant. I can help you analyze your spending, answer questions about your transactions, and provide financial insights. What would you like to know?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I can help you with:\n- Analyzing your spending by category\n- Calculating total expenses or income\n- Finding your biggest expenses\n- Showing savings summaries\n- Answering questions about specific transactions\n\nWhat would you like to explore?";
  }
  
  // Default response
  return `I see you have **${transactions.length}** transactions with total expenses of **$${totalExpenses.toFixed(2)}**. Ask me about specific categories, time periods, or spending patterns!`;
}

export { router as aiRouter };
