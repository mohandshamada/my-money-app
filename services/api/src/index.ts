import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';

import { authRouter } from './routes/auth';
import { oauthRouter } from './routes/oauth';
import { transactionRouter } from './routes/transactions';
import { budgetRouter } from './routes/budgets';
import { forecastRouter } from './routes/forecast';
import { bankRouter } from './routes/bank';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/auth', authRouter);
app.use('/auth', oauthRouter);

// Protected routes
app.use('/api/transactions', authMiddleware, transactionRouter);
app.use('/api/budgets', authMiddleware, budgetRouter);
app.use('/api/forecast', authMiddleware, forecastRouter);
app.use('/api/bank', authMiddleware, bankRouter);
app.use('/api/ai', authMiddleware, aiRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CashFlow API running on port ${PORT}`);
});
