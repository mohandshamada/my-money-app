import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import axios from 'axios';
import crypto from 'crypto';
import { fromBuffer } from 'pdf2pic';
import rateLimit from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();

// AI Parser rate limiter - higher limit since it's a premium feature
const aiParserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 AI parses per 15 minutes per user
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip || 'unknown';
  },
  message: { error: 'AI parsing limit reached. Please wait 15 minutes or upgrade your plan.' }
});

// Tier configuration
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STANDARD: 'standard',
  PREMIUM: 'premium'
} as const;

// Get user's subscription tier
export async function getUserTier(userId: string): Promise<string> {
  const settings = await prisma.user_settings.findUnique({
    where: { user_id: userId }
  });
  
  if (settings?.subscription_expires_at && settings.subscription_expires_at < new Date()) {
    return SUBSCRIPTION_TIERS.FREE;
  }
  
  return settings?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
}

// Convert PDF buffer to images
async function pdfToImages(pdfBuffer: Buffer, maxPages: number = 5): Promise<string[]> {
  const convert = fromBuffer(pdfBuffer, {
    density: 150,
    format: 'png',
    width: 1200,
    height: 1600,
    quality: 80,
    preserveAspectRatio: true
  });
  
  const images: string[] = [];
  
  for (let i = 1; i <= maxPages; i++) {
    try {
      const result: any = await convert(i);
      if (result && result.base64) {
        images.push(`data:image/png;base64,${result.base64}`);
      }
    } catch (e) {
      break;
    }
  }
  
  return images;
}

// Vision AI endpoint
router.post('/analyze-ai', aiParserLimiter, authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const tier = await getUserTier(userId);
    const { fileContent, fileName, bankType } = req.body;
    
    if (!fileContent) {
      return res.status(400).json({ error: 'File content required' });
    }
    
    const fileExt = '.' + (fileName?.split('.').pop() || '').toLowerCase();
    const isPdf = fileExt === '.pdf';
    const isImage = ['.png', '.jpg', '.jpeg'].includes(fileExt);
    
    const apiKey = process.env.GLM5_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    
    let result;
    
    if (isPdf || isImage) {
      // VISION MODEL APPROACH
      let images: string[] = [];
      
      if (isPdf) {
        const base64Data = fileContent.replace(/^data:application\/pdf;base64,/, '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        images = await pdfToImages(pdfBuffer, 5);
        
        if (images.length === 0) {
          return res.status(422).json({ error: 'Failed to convert PDF to images' });
        }
      } else {
        images = [fileContent];
      }
      
      const visionPrompt = `Analyze this bank statement image and extract all visible transactions.

CRITICAL INSTRUCTIONS:
1. Look at TABLE COLUMNS carefully - transaction amount is in "Debit", "Credit", "Amount" columns
2. DO NOT confuse "Balance" column with transaction amounts!
3. The running balance changes incrementally - IGNORE THIS for amounts
4. Parse dates as shown (DD/MM/YYYY, MM/DD/YYYY, etc.)
5. Determine "debit" (money out) vs "credit" (money in)

Extract in JSON format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Transaction description",
      "merchant": "Merchant name",
      "amount": 123.45,
      "type": "debit" | "credit",
      "category": "category_id",
      "confidence": 0.0-1.0
    }
  ],
  "summary": { "totalTransactions": number, "totalDebits": number, "totalCredits": number }
}

Categories: groceries, dining, transport, shopping, entertainment, bills, healthcare, salary, transfer, other

Return ONLY valid JSON, no markdown.`;

      const visionResponse = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4v-plus',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              ...images.map((img: string) => ({
                type: 'image_url' as const,
                image_url: { url: img }
              }))
            ]
          }],
          max_tokens: 4000,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );
      
      const content = visionResponse.data.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                          content.match(/```\n?([\s\S]*?)\n?```/) ||
                          [null, content];
        result = JSON.parse(jsonMatch[1] || content);
      } catch (parseError) {
        console.error('Vision AI parsing failed:', content.substring(0, 500));
        return res.status(422).json({ 
          error: 'AI failed to parse statement from image',
          rawResponse: content.substring(0, 500)
        });
      }
    } else {
      // TEXT-BASED for CSV/Excel
      const prompt = `Analyze this bank statement and extract all transactions.

CRITICAL: DO NOT confuse "Balance" column with transaction amounts!

File: ${fileName || 'statement'}

Content:
${fileContent.substring(0, 15000)}

Extract in JSON format with transactions array containing date, description, merchant, amount, type (debit/credit), category, confidence.

Categories: groceries, dining, transport, shopping, entertainment, bills, healthcare, salary, transfer, other

Return ONLY valid JSON.`;

      const aiResponse = await axios.post(
        'https://api.z.ai/api/coding/paas/v4/chat/completions',
        {
          model: 'glm-5',
          messages: [
            { role: 'system', content: 'You are a financial data extraction AI.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );
      
      const aiContent = aiResponse.data.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                          aiContent.match(/```\n?([\s\S]*?)\n?```/) ||
                          [null, aiContent];
        result = JSON.parse(jsonMatch[1] || aiContent);
      } catch (parseError) {
        console.error('AI response parsing failed:', aiContent.substring(0, 500));
        return res.status(422).json({ 
          error: 'AI failed to parse statement',
          rawResponse: aiContent.substring(0, 500)
        });
      }
    }
    
    // Validate results
    const transactions = (result.transactions || []).map((t: any) => ({
      date: t.date || new Date().toISOString().split('T')[0],
      description: t.description || 'Unknown transaction',
      merchant: t.merchant || t.description?.substring(0, 20) || 'Unknown',
      amount: Math.abs(parseFloat(t.amount) || 0),
      type: t.type || (t.amount < 0 ? 'debit' : 'credit'),
      category: t.category || 'other',
      confidence: t.confidence || 0.5,
      isExpense: t.type === 'debit' || t.amount < 0
    }));
    
    res.json({
      method: isPdf || isImage ? 'vision-ai' : 'text-ai',
      tier,
      transactions,
      totalFound: transactions.length,
      summary: result.summary || {},
      confidence: transactions.reduce((sum: number, t: any) => sum + (t.confidence || 0), 0) / (transactions.length || 1)
    });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze statement' });
  }
});

// Standard parsing endpoint
router.post('/parse-standard', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const tier = await getUserTier(userId);
    const { fileContent, fileName } = req.body;
    
    if (!fileContent) {
      return res.status(400).json({ error: 'File content required' });
    }
    
    const fileExt = '.' + (fileName?.split('.').pop() || '').toLowerCase();
    
    // Parse transactions from text
    const lines = fileContent.split('\n').filter((line: string) => line.trim());
    const transactions: any[] = [];
    
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const amountPattern = /([\d,]+\.\d{2})/;
    
    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      const amountMatch = line.match(amountPattern);
      
      if (dateMatch && amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(',', ''));
        transactions.push({
          date: dateMatch[1],
          description: line.replace(datePattern, '').replace(amountPattern, '').trim(),
          merchant: line.substring(0, 20).trim(),
          amount: Math.abs(amount),
          type: amount < 0 ? 'debit' : 'credit',
          category: 'other',
          isExpense: amount < 0
        });
      }
    }
    
    res.json({
      method: 'standard',
      tier,
      transactions,
      totalFound: transactions.length
    });
    
  } catch (error) {
    console.error('Standard parsing error:', error);
    res.status(500).json({ error: 'Failed to parse statement' });
  }
});

export default router;
