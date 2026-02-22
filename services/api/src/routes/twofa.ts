// @ts-nocheck
import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const router = Router();
const prisma = new PrismaClient();

// Generate TOTP secret for 2FA setup
router.post('/2fa/setup', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate secret
    const secret = crypto.randomBytes(20).toString('base64');
    
    // Create TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: 'My Money',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    
    // Get URI for QR code
    const otpauth = totp.toString();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    // Temporarily store secret
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorSecret: secret,
        twoFactorEnabled: false
      }
    });

    res.json({ secret, qrCode: qrCodeUrl, otpauth });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', async (req: any, res: any) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up' });
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'My Money',
      label: user.email,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
    });
    
    const delta = totp.validate({ token: code, window: 1 });
    
    if (delta !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });
      
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      res.json({ success: true, message: '2FA enabled', backupCodes });
    } else {
      res.status(400).json({ error: 'Invalid code' });
    }
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req: any, res: any) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret || '')
    });
    
    const delta = totp.validate({ token: code, window: 1 });
    
    if (delta !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null }
      });
      
      res.json({ success: true, message: '2FA disabled' });
    } else {
      res.status(400).json({ error: 'Invalid code' });
    }
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Verify 2FA code during login
export async function verify2FA(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return true;
  }
  
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
  });
  
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export { router as twoFactorRouter };