// @ts-nocheck
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().optional(),
  timezone: z.string().default('UTC'),
  currency: z.string().default('USD')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: password_hash,
        full_name: data.fullName || undefined,
        timezone: data.timezone,
        currency: data.currency,
        updated_at: new Date()
      },
      select: { id: true, email: true, full_name: true }
    });
    
    // Generate tokens
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions["expiresIn"] });
    const refresh_token = crypto.randomBytes(40).toString('hex');
    
    // Store refresh token
    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: crypto.createHash('sha256').update(refresh_token).digest('hex'),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
    
    res.status(201).json({
      user,
      token,
      refresh_token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const email = data.email.trim().toLowerCase();

    // Find user
    const user = await prisma.users.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions["expiresIn"] });
    const refresh_token = crypto.randomBytes(40).toString('hex');
    
    // Store refresh token
    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: crypto.createHash('sha256').update(refresh_token).digest('hex'),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      token,
      refresh_token
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    
    const storedToken = await prisma.refresh_tokens.findFirst({
      where: {
        token_hash,
        revoked: false,
        expires_at: { gt: new Date() }
      },
      include: { user: true }
    });
    
    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const token = jwt.sign(
      { user_id: storedToken.user.id, email: storedToken.user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY as jwt.SignOptions['expiresIn'] }
    );
    
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (refresh_token) {
      const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
      
      await prisma.refresh_tokens.updateMany({
        where: { token_hash },
        data: { revoked: true }
      });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Send verification email
router.post('/verify-email/send', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Store token
    await prisma.password_resets.create({
      data: {
        user_id: user.id,
        token_hash: token_hash,
        new_email: normalizedEmail,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    
    // Build verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'https://mymoney.mshousha.uk'}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
    
    // TODO: Send actual email
    // For now, log the link (in production, integrate with email service)
    console.log('📧 Verification email:', {
      to: normalizedEmail,
      link: verificationLink
    });
    
    res.json({ 
      message: 'Verification email sent',
      // Include link in development only
      ...(process.env.NODE_ENV !== 'production' && { verificationLink })
    });
  } catch (error) {
    next(error);
  }
});

// Verify email token
router.post('/verify-email/confirm', async (req, res, next) => {
  try {
    const { token, email } = req.body;
    
    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email required' });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find valid token
    const resetRecord = await prisma.password_resets.findFirst({
      where: {
        token_hash,
        new_email: normalizedEmail,
        used_at: null,
        expires_at: { gt: new Date() }
      },
      include: { users: true }
    });
    
    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Mark email as verified
    await prisma.users.update({
      where: { id: resetRecord.user_id },
      data: { 
        email_verified: true,
        updated_at: new Date()
      }
    });
    
    // Mark token as used
    await prisma.password_resets.update({
      where: { id: resetRecord.id },
      data: { used_at: new Date() }
    });
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
