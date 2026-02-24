import express, { RequestHandler } from 'express';
import cors from 'cors';
import axios from 'axios';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

import { authRouter } from './routes/auth';
import { oauthRouter } from './routes/oauth';
import { transactionRouter } from './routes/transactions';
import { budgetRouter } from './routes/budgets';
import { forecastRouter } from './routes/forecast';
import { bankRouter } from './routes/bank';
import { aiRouter } from './routes/ai';
import { twoFactorRouter } from './routes/twofa';
import { passkeyRouter } from './routes/passkeys';
import { alertsRouter } from './routes/alerts';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Trust proxy for Cloudflare tunnel
app.set('trust proxy', 1);

// Passport initialization
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (both paths for tunnel routing)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (with /api prefix for tunnel routing)
app.use('/api/auth', authRouter);
app.use('/api/auth', oauthRouter);

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
      createdAt: user.created_at
    }});
  }).catch(next);
});

app.use('/api/auth/me', protectedAuthHandler, asHandler(meRouter));
app.use('/api/auth', asHandler(authMiddleware), asHandler(twoFactorRouter));
app.use('/api/auth', asHandler(authMiddleware), asHandler(passkeyRouter));
app.use('/api/alerts', asHandler(authMiddleware), asHandler(alertsRouter));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CashFlow API running on port ${PORT}`);
});
