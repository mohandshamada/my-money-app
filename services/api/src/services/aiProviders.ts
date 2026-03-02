import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-byte-encryption-key!!';

export function decrypt(text: string): string {
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface AIProviderConfig {
  provider: string;
  apiKey: string;
  model?: string;
}

export async function getUserAIConfig(userId: string): Promise<AIProviderConfig | null> {
  const settings = await prisma.user_settings.findUnique({
    where: { user_id: userId }
  });
  
  if (!settings || !settings.ai_enabled || !settings.ai_api_key || !settings.ai_provider || settings.ai_provider === 'local') {
    return null;
  }
  
  let apiKey = '';
  try {
    const decrypted = decrypt(settings.ai_api_key);
    if (decrypted.startsWith('{')) {
      const keys = JSON.parse(decrypted);
      apiKey = keys[settings.ai_provider];
    } else {
      apiKey = decrypted;
    }
  } catch (e) {
    return null;
  }
  
  if (!apiKey) return null;
  
  return {
    provider: settings.ai_provider,
    apiKey: apiKey,
    model: settings.ai_model || undefined
  };
}

export async function generateInsightsWithAI(
  config: AIProviderConfig,
  transactions: any[],
  timeframe: string
): Promise<any> {
  const prompt = `Analyze these financial transactions and provide insights:

Timeframe: ${timeframe}
Transactions: ${JSON.stringify(transactions.slice(0, 100))}

Provide a JSON response with:
{
  "summary": "Brief overview of spending patterns with specific dollar amounts (2-3 sentences)",
  "anomalies": ["List unusual spending patterns or large transactions"],
  "recommendations": ["Actionable savings tips"],
  "trends": {
    "increasing": ["Categories with high spending"],
    "decreasing": []
  }
}

Be specific with actual dollar amounts from the data.`;

  switch (config.provider) {
    case 'openai':
      return generateWithOpenAI(config, prompt);
    case 'openrouter':
      return generateWithOpenRouter(config, prompt);
    case 'zai':
      return generateWithZAI(config, prompt);
    case 'kimi':
      return generateWithKimi(config, prompt);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

async function generateWithOpenAI(config: AIProviderConfig, prompt: string) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a financial advisor AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  
  return parseAIResponse(response.data.choices[0]?.message?.content);
}

async function generateWithOpenRouter(config: AIProviderConfig, prompt: string) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: config.model || 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'You are a financial advisor AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mymoney.mshousha.uk',
        'X-Title': 'My Money AI'
      },
      timeout: 60000
    }
  );
  
  return parseAIResponse(response.data.choices[0]?.message?.content);
}

async function generateWithZAI(config: AIProviderConfig, prompt: string) {
  const response = await axios.post(
    'https://api.z.ai/api/coding/paas/v4/chat/completions',
    {
      model: config.model || 'glm-5',
      messages: [
        { role: 'system', content: 'You are a financial advisor AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  
  return parseAIResponse(response.data.choices[0]?.message?.content);
}

async function generateWithKimi(config: AIProviderConfig, prompt: string) {
  const response = await axios.post(
    'https://api.moonshot.cn/v1/chat/completions',
    {
      model: config.model || 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: 'You are a financial advisor AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  
  return parseAIResponse(response.data.choices[0]?.message?.content);
}

function parseAIResponse(content: string | undefined | null): any {
  if (!content || content.trim() === '') {
    console.error('Empty AI response received');
    throw new Error('AI returned empty response');
  }
  
  try {
    // Try to extract JSON if wrapped in markdown
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    const insights = JSON.parse(jsonMatch[1] || content);
    
    return {
      summary: insights.summary || 'Analysis completed',
      anomalies: insights.anomalies || [],
      recommendations: insights.recommendations || [],
      trends: insights.trends || { increasing: [], decreasing: [] },
      aiGenerated: true,
      provider: 'ai'
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid AI response format');
  }
}

export async function categorizeTransactionWithAI(
  config: AIProviderConfig,
  merchant: string,
  description: string,
  amount: number,
  categories: any[]
): Promise<any> {
  const prompt = `Categorize this transaction:
Merchant: ${merchant || 'Unknown'}
Description: ${description || 'Unknown'}
Amount: $${amount}

Available categories:
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

Respond with JSON:
{
  "category": "category_id",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`;

  const insights = await generateInsightsWithAI(config, [], '');
  return insights; // Will be parsed by caller
}
