import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Encryption key from env (should be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-byte-encryption-key!!';

// Simple encryption for API keys using AES-256-GCM
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  // Ensure key is 32 bytes for AES-256
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

function decrypt(text: string): string {
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

// Get user settings
router.get('/', authMiddleware as any, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    let settings = await prisma.user_settings.findUnique({
      where: { user_id: userId }
    });
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.user_settings.create({
        data: {
          user_id: userId,
          ai_provider: 'local',
          ai_enabled: false
        }
      });
    }
    
    // Parse API keys to know which ones are set
    let keysStatus: Record<string, boolean> = {};
    if (settings.ai_api_key) {
      try {
        const decrypted = decrypt(settings.ai_api_key);
        // Try parsing as JSON (new format)
        if (decrypted.startsWith('{')) {
          const keys = JSON.parse(decrypted);
          for (const key in keys) {
            keysStatus[key] = true;
          }
        } else {
          // Old format - legacy key belongs to the current provider
          if (settings.ai_provider && settings.ai_provider !== 'local') {
            keysStatus[settings.ai_provider] = true;
          }
        }
      } catch (e) {
        console.error('Failed to parse api keys state');
      }
    }

    // Return settings without API key
    res.json({
      ai_provider: settings.ai_provider,
      ai_model: settings.ai_model,
      ai_enabled: settings.ai_enabled,
      has_api_key: !!settings.ai_api_key,
      keys_status: keysStatus
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update AI settings
router.put('/ai', authMiddleware as any, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { ai_provider, ai_api_key, ai_model, ai_enabled } = req.body;
    
    // Validate provider
    const validProviders = ['local', 'openai', 'openrouter', 'zai', 'kimi', 'huggingface'];
    if (ai_provider && !validProviders.includes(ai_provider)) {
      return res.status(400).json({ error: 'Invalid AI provider' });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (ai_provider !== undefined) updateData.ai_provider = ai_provider;
    if (ai_model !== undefined) updateData.ai_model = ai_model;
    if (ai_enabled !== undefined) updateData.ai_enabled = ai_enabled;
    
    // Encrypt API key if provided
    if (ai_api_key !== undefined) {
      if (ai_provider && ai_provider !== 'local') {
        try {
          let currentKeys: Record<string, string> = {};
          
          // Get existing keys
          const existingSettings = await prisma.user_settings.findUnique({ where: { user_id: userId } });
          if (existingSettings?.ai_api_key) {
            try {
              const decrypted = decrypt(existingSettings.ai_api_key);
              if (decrypted.startsWith('{')) {
                currentKeys = JSON.parse(decrypted);
              } else if (existingSettings.ai_provider && existingSettings.ai_provider !== 'local') {
                // Migrate legacy key
                currentKeys[existingSettings.ai_provider] = decrypted;
              }
            } catch (e) {}
          }
          
          // Update the specific provider's key
          if (ai_api_key === '') {
             delete currentKeys[ai_provider];
          } else {
             currentKeys[ai_provider] = ai_api_key;
          }
          
          // Save back as encrypted JSON if there are any keys, otherwise null
          if (Object.keys(currentKeys).length > 0) {
            updateData.ai_api_key = encrypt(JSON.stringify(currentKeys));
          } else {
            updateData.ai_api_key = null;
          }
        } catch (e) {
          console.error("Error updating keys", e);
        }
      } else if (!ai_api_key) {
        updateData.ai_api_key = null;
      }
    }
    
    // Upsert settings
    const settings = await prisma.user_settings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...updateData
      },
      update: updateData
    });
    
    // Parse API keys to know which ones are set
    let keysStatus: Record<string, boolean> = {};
    if (settings.ai_api_key) {
      try {
        const decrypted = decrypt(settings.ai_api_key);
        if (decrypted.startsWith('{')) {
          const keys = JSON.parse(decrypted);
          for (const key in keys) {
            keysStatus[key] = true;
          }
        } else if (settings.ai_provider && settings.ai_provider !== 'local') {
          keysStatus[settings.ai_provider] = true;
        }
      } catch (e) {}
    }
    
    res.json({
      ai_provider: settings.ai_provider,
      ai_model: settings.ai_model,
      ai_enabled: settings.ai_enabled,
      has_api_key: !!settings.ai_api_key,
      keys_status: keysStatus
    });
  } catch (error) {
    console.error('Update AI settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Test AI connection
router.post('/ai/test', authMiddleware as any, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const settings = await prisma.user_settings.findUnique({
      where: { user_id: userId }
    });
    
    if (!settings || !settings.ai_enabled || !settings.ai_api_key) {
      return res.status(400).json({ error: 'AI not configured' });
    }
    
    const provider = settings.ai_provider;
    if (provider === 'local') return res.status(400).json({ error: 'Cannot test local provider' });
    
    let apiKey = '';
    const decrypted = decrypt(settings.ai_api_key);
    if (decrypted.startsWith('{')) {
      const keys = JSON.parse(decrypted);
      apiKey = keys[provider];
    } else {
      apiKey = decrypted;
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key not found for provider ' + provider });
    }
    
    // Test the provider
    const result = await testAIProvider(settings.ai_provider, apiKey, settings.ai_model);
    
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Test AI error:', error);
    res.status(500).json({ error: error.message || 'Failed to test AI connection' });
  }
});

async function testAIProvider(provider: string, apiKey: string, model?: string) {
  const testPrompt = 'Reply with: TEST_OK';
  
  switch (provider) {
    case 'openai':
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      const openaiData = await openaiResponse.json() as { choices: Array<{ message: { content: string } }> };
      return openaiData.choices[0]?.message?.content;
      
    case 'openrouter':
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mymoney.mshousha.uk',
          'X-Title': 'My Money AI'
        },
        body: JSON.stringify({
          model: model || 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]?.message?.content;
      
    case 'zai':
      const zaiResponse = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'glm-5',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      const zaiData = await zaiResponse.json() as { choices: Array<{ message: { content: string } }> };
      return zaiData.choices[0]?.message?.content;
      
    case 'kimi':
      const kimiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'moonshot-v1-8k',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      const kimiData = await kimiResponse.json() as { choices: Array<{ message: { content: string } }> };
      return kimiData.choices[0]?.message?.content;
      
    default:
      throw new Error('Unknown provider');
  }
}

// Delete API key
router.delete('/ai', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Update settings to remove API key for current provider
    const settings = await prisma.user_settings.findUnique({ where: { user_id: userId } });
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    
    let currentKeys: Record<string, string> = {};
    if (settings.ai_api_key) {
      try {
        const decrypted = decrypt(settings.ai_api_key);
        if (decrypted.startsWith('{')) {
          currentKeys = JSON.parse(decrypted);
        } else if (settings.ai_provider && settings.ai_provider !== 'local') {
          currentKeys[settings.ai_provider] = decrypted;
        }
      } catch(e) {}
    }
    
    if (settings.ai_provider && settings.ai_provider !== 'local') {
      delete currentKeys[settings.ai_provider];
    }
    
    await prisma.user_settings.update({
      where: { user_id: userId },
      data: {
        ai_api_key: Object.keys(currentKeys).length > 0 ? encrypt(JSON.stringify(currentKeys)) : null,
        ai_enabled: Object.keys(currentKeys).length > 0 ? settings.ai_enabled : false,
        updated_at: new Date()
      }
    });
    
    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get user tier
router.get('/tier', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const settings = await prisma.user_settings.findUnique({
      where: { user_id: userId }
    });
    const tier = settings?.subscription_tier || 'free';
    res.json({ tier, expiresAt: settings?.subscription_expires_at });
  } catch (error) {
    console.error('Get tier error:', error);
    res.status(500).json({ error: 'Failed to get tier info' });
  }
});

export default router;
