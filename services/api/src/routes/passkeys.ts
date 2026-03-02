// @ts-nocheck
import { Router } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { isoBase64URLToBuffer, isoUint8ArrayToBase64URL } from '@simplewebauthn/server/helpers';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// RP config
const rpName = 'My Money';
const getRPConfig = (req: any) => {
  const host = req.get('host') || 'localhost:5000';
  const domain = host.split(':')[0];
  
  const rpID = process.env.WEBAUTHN_RP_ID || (domain === 'localhost' ? 'localhost' : domain);
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const origin = process.env.WEBAUTHN_ORIGIN || process.env.FRONTEND_URL || `${protocol}://${host.replace('5000', '5173').replace('3000', '5173')}`;
  
  return { rpID, origin };
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const signChallenge = (challenge: string, userId?: string) => {
  return jwt.sign({ challenge, userId }, JWT_SECRET, { expiresIn: '5m' });
};

const verifyChallenge = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { challenge: string; userId?: string };
  } catch (e) {
    return null;
  }
};

// Start registration
router.post('/register/start', authMiddleware as any, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rpID } = getRPConfig(req);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const excludeCredentials: any[] = user.passkeys.map((pk) => ({
      id: pk.credential_id,
      type: 'public-key',
      transports: ['internal'],
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Uint8Array.from(Buffer.from(userId)),
      userName: user.email,
      userDisplayName: user.full_name || user.email,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });

    const opts: any = { ...options };
    if (opts.hints && Array.isArray(opts.hints) && opts.hints.length === 0) delete opts.hints;
    if (opts.excludeCredentials && Array.isArray(opts.excludeCredentials) && opts.excludeCredentials.length === 0) delete opts.excludeCredentials;

    const challengeToken = signChallenge(opts.challenge, userId);
    res.json({ options: opts, challengeToken });
  } catch (error) {
    console.error('Passkey registration start error:', error);
    res.status(500).json({ error: 'Failed to start passkey registration' });
  }
});

// Verify registration
router.post('/register/verify', authMiddleware as any, async (req: any, res: any) => {
  try {
    const { credential, challengeToken, name } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rpID, origin } = getRPConfig(req);
    const decoded = verifyChallenge(challengeToken);
    if (!decoded || decoded.userId !== userId) {
      return res.status(400).json({ error: 'Invalid or expired challenge token' });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: decoded.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Registration verification failed' });
    }

    const { registrationInfo } = verification;
    const passkey = await prisma.passkeys.create({
      data: {
        user_id: userId,
        credential_id: registrationInfo.credentialID,
        public_key: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
        sign_count: registrationInfo.counter,
        aaguid: registrationInfo.aaguid,
        name: name || 'Passkey',
        device_type: 'platform',
      },
    });

    res.json({ verified: true, passkey });
  } catch (error) {
    console.error('Passkey registration verify error:', error);
    res.status(500).json({ error: 'Failed to verify passkey registration' });
  }
});

// Start authentication
router.post('/authenticate/start', async (req: any, res: any) => {
  try {
    const { rpID } = getRPConfig(req);
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: [],
    });

    const challengeToken = signChallenge(options.challenge);
    res.json({ options, challengeToken });
  } catch (error) {
    console.error('Passkey authentication start error:', error);
    res.status(500).json({ error: 'Failed to start passkey authentication' });
  }
});

// Verify authentication
router.post('/authenticate/verify', async (req: any, res: any) => {
  try {
    const { credential, challengeToken } = req.body;
    if (!challengeToken) return res.status(400).json({ error: 'Missing challenge token' });

    const { rpID, origin } = getRPConfig(req);
    const decoded = verifyChallenge(challengeToken);
    if (!decoded) return res.status(400).json({ error: 'Invalid or expired challenge token' });

    const passkey = await prisma.passkeys.findUnique({
      where: { credential_id: credential.id },
      include: { user: true },
    });

    if (!passkey) return res.status(400).json({ error: 'Passkey not found' });

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: decoded.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: passkey.credential_id,
        credentialPublicKey: Buffer.from(passkey.public_key, 'base64'),
        counter: passkey.sign_count,
      },
    });

    if (!verification.verified) return res.status(400).json({ error: 'Authentication failed' });

    await prisma.passkeys.update({
      where: { id: passkey.id },
      data: {
        sign_count: verification.authenticationInfo.newCounter,
        last_used_at: new Date(),
      },
    });

    const token = jwt.sign(
      { userId: passkey.user.id, email: passkey.user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      verified: true,
      user: {
        id: passkey.user.id,
        email: passkey.user.email,
        fullName: passkey.user.full_name,
      },
      token,
    });
  } catch (error) {
    console.error('Passkey authentication verify error:', error);
    res.status(500).json({ error: 'Failed to verify passkey authentication' });
  }
});

// List passkeys
router.get('/', authMiddleware as any, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const passkeys = await prisma.passkeys.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        name: true,
        device_type: true,
        created_at: true,
        last_used_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ passkeys });
  } catch (error) {
    console.error('Passkeys list error:', error);
    res.status(500).json({ error: 'Failed to list passkeys' });
  }
});

// Delete passkey
router.delete('/:id', authMiddleware as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const passkey = await prisma.passkeys.findFirst({
      where: { id, user_id: userId },
    });

    if (!passkey) return res.status(404).json({ error: 'Passkey not found' });

    await prisma.passkeys.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Passkey delete error:', error);
    res.status(500).json({ error: 'Failed to delete passkey' });
  }
});

export { router as passkeyRouter };
