import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
});

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string()
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});

// Get user profile
router.get('/', authMiddleware as any, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        timezone: true,
        currency: true,
        email_verified: true,
        two_factor_enabled: true,
        created_at: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update profile (name, timezone, currency)
router.patch('/', authMiddleware as any, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const data = updateProfileSchema.parse(req.body);
    
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        ...data,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        timezone: true,
        currency: true,
        email_verified: true,
        two_factor_enabled: true,
        created_at: true
      }
    });
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Change email (requires password verification)
router.post('/change-email', authMiddleware as any, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { newEmail, password } = changeEmailSchema.parse(req.body);
    const normalizedEmail = newEmail.trim().toLowerCase();
    
    // Get user with password
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Check if email is already taken
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store pending email change
    await prisma.password_resets.create({
      data: {
        user_id: userId,
        token_hash: crypto.createHash('sha256').update(verificationToken).digest('hex'),
        new_email: normalizedEmail,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    
    // TODO: Send verification email
    // For now, auto-verify in development
    
    // Update email immediately (in production, wait for verification)
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        email_verified: false, // Require re-verification
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        timezone: true,
        currency: true
      }
    });
    
    res.json({ 
      user: updatedUser,
      message: 'Email updated successfully. Please verify your new email address.'
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authMiddleware as any, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date()
      }
    });
    
    // Revoke all refresh tokens for security
    await prisma.refresh_tokens.updateMany({
      where: { user_id: userId },
      data: { revoked: true }
    });
    
    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
});

// Upload avatar
router.post('/avatar', authMiddleware as any, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({ error: 'Avatar URL required' });
    }
    
    // Validate URL
    try {
      new URL(avatarUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        avatar_url: avatarUrl,
        updated_at: new Date()
      },
      select: {
        id: true,
        avatar_url: true
      }
    });
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/', authMiddleware as any, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Delete user (cascade will handle related data)
    await prisma.users.delete({
      where: { id: userId }
    });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
