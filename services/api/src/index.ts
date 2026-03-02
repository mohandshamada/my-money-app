import express, { RequestHandler } from 'express';
import cors from 'cors';
import axios from 'axios';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { loggerMiddleware } from './middleware/logger';

import { authRouter } from './routes/auth';
import { oauthRouter } from './routes/oauth';
import { transactionRouter } from './routes/transactions';
import { budgetRouter } from './routes/budgets';
import { forecastRouter } from './routes/forecast';
import { bankRouter } from './routes/bank';
import { aiRouter } from './routes/ai';
import settingsRouter from './routes/settings';
import { twoFactorRouter } from './routes/twofa';
import { passkeyRouter } from './routes/passkeys';
import { alertsRouter } from './routes/alerts';
import subscriptionRouter from './routes/subscriptions';
import exchangeRatesRouter from './routes/exchangeRates';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for easier development
}));
app.use(cors({
  origin: true, // Reflect request origin
  credentials: true
}));

// Trust proxy for Cloudflare tunnel
app.set('trust proxy', 1);

// Passport initialization
app.use(passport.initialize());

// Auth rate limiter - more lenient for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  keyGenerator: (req) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return ip.split(',')[0].trim();
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  message: { error: 'Too many login attempts, please try again later' }
});

// General API rate limiting - skip for auth routes (they have their own limits)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'), // Increased to 1000
  skip: (req) => req.path.startsWith('/api/auth'), // Skip auth routes
  keyGenerator: (req) => {
    // Cloudflare puts real client IP in CF-Connecting-IP header
    // Fallback to X-Forwarded-For, then req.ip
    const ip = (req.headers['cf-connecting-ip'] as string) 
      || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.ip 
      || 'unknown';
    return ip;
  },
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware (after body parsing)
app.use(loggerMiddleware);

// Health check (both paths for tunnel routing)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (with /api prefix for tunnel routing)
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/auth', authLimiter, oauthRouter);

// OAuth callbacks (public - no auth required)
app.get('/api/bank/callback/truelayer', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      console.error('TrueLayer OAuth error:', error, error_description);
      return res.redirect('/settings?bank_error=' + encodeURIComponent(error_description as string || error as string));
    }
    
    if (!code) {
      return res.redirect('/settings?bank_error=missing_code');
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://auth.truelayer-sandbox.com/connect/token',
      {
        grant_type: 'authorization_code',
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.API_URL}/api/bank/callback/truelayer`,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Redirect to frontend with token
    res.redirect(`/settings?bank_success=truelayer&token=${encodeURIComponent(access_token)}`);
  } catch (err: any) {
    console.error('TrueLayer callback error:', err.response?.data || err.message);
    res.redirect('/settings?bank_error=callback_failed');
  }
});

// Protected routes (cast for Express/Passport Request.user type compatibility with our AuthRequest)
const asHandler = (h: unknown) => h as RequestHandler;
app.use('/api/transactions', asHandler(authMiddleware), asHandler(transactionRouter));
app.use('/api/budgets', asHandler(authMiddleware), asHandler(budgetRouter));
app.use('/api/forecast', asHandler(authMiddleware), asHandler(forecastRouter));
app.use('/api/bank', asHandler(authMiddleware), asHandler(bankRouter));
app.use('/api/ai', asHandler(authMiddleware), asHandler(aiRouter));
app.use('/api/settings', asHandler(authMiddleware), asHandler(settingsRouter));

// Profile routes
import profileRouter from './routes/profile';
app.use('/api/profile', asHandler(authMiddleware), asHandler(profileRouter));

// Statement parser route (for PDF and AI parsing)
import statementParserRouter from './routes/statementParser';
app.use('/api/statements', asHandler(authMiddleware), asHandler(statementParserRouter));

// AI Statement analysis (premium tier)
import statementsAI from './routes/statementsAI';
app.use('/api/statements/ai', asHandler(authMiddleware), asHandler(statementsAI));

// Protected auth routes (/me, 2FA)
const protectedAuthHandler = asHandler(authMiddleware);
const meRouter = express.Router();

// GET /me
meRouter.get('/', (req: any, res: any, next: any) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      timezone: true,
      currency: true,
      two_factor_enabled: true,
      role: true,
      created_at: true
    }
  }).then(user => {
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      timezone: user.timezone,
      currency: user.currency,
      twoFactorEnabled: user.two_factor_enabled,
      role: user.role,
      createdAt: user.created_at
    }});
  }).catch(next);
});

// PATCH /me - Update user profile
meRouter.patch('/', (req: any, res: any, next: any) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { currency, timezone } = req.body;
  const updateData: any = { updated_at: new Date() };
  
  if (currency) updateData.currency = currency;
  if (timezone) updateData.timezone = timezone;
  
  prisma.users.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      full_name: true,
      timezone: true,
      currency: true,
      two_factor_enabled: true,
      role: true,
      created_at: true
    }
  }).then(user => {
    res.json({ user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      timezone: user.timezone,
      currency: user.currency,
      twoFactorEnabled: user.two_factor_enabled,
      role: user.role,
      createdAt: user.created_at
    }});
  }).catch(next);
});

app.use('/api/auth/me', protectedAuthHandler, asHandler(meRouter));
app.use('/api/auth', asHandler(authMiddleware), asHandler(twoFactorRouter));

// Passkey routes - use dedicated /api/pk path to avoid conflicts
app.use('/api/pk', passkeyRouter);

app.use('/api/alerts', asHandler(authMiddleware), asHandler(alertsRouter));
app.use('/api/subscriptions', asHandler(authMiddleware), asHandler(subscriptionRouter));
app.use('/api/exchange-rates', asHandler(exchangeRatesRouter));

// Error handling
// Admin routes
import adminRouter from './routes/admin';
import rulesRouter from './routes/rules';
import stripeRouter from './routes/stripe';
app.use('/api/rules', asHandler(authMiddleware), asHandler(rulesRouter));
app.use('/api/admin', asHandler(authMiddleware), asHandler(adminRouter));
app.use('/api/stripe', stripeRouter);

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CashFlow API running on port ${PORT}`);
});
