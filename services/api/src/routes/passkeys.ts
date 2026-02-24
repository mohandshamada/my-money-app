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

// Helper to encode string to base64url
const toBase64Url = (str: string): string => {
  return Buffer.from(str).toString('base64url');
};

const router = Router();
const prisma = new PrismaClient();

// RP config - update with your actual domain
const rpName = 'My Money';
const rpID = process.env.WEBAUTHN_RP_ID || 'mymoney.mshousha.uk';
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Helper to sign challenge token
const signChallenge = (challenge: string, userId?: string) => {
  return jwt.sign({ challenge, userId }, JWT_SECRET, { expiresIn: '5m' });
};

// Helper to verify challenge token
const verifyChallenge = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { challenge: string; userId?: string };
  } catch (e) {
    return null;
  }
};

// Generate registration options
router.post('/passkey/register/start', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get existing passkey credential IDs to prevent re-registration
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

    // Remove empty arrays that can cause issues with some browsers
    const opts: any = { ...options };
    console.log('Before cleanup - hints:', opts.hints, 'excludeCredentials:', opts.excludeCredentials);
    if (opts.hints && Array.isArray(opts.hints) && opts.hints.length === 0) {
      delete opts.hints;
      console.log('Deleted empty hints array');
    }
    if (opts.excludeCredentials && Array.isArray(opts.excludeCredentials) && opts.excludeCredentials.length === 0) {
      delete opts.excludeCredentials;
      console.log('Deleted empty excludeCredentials array');
    }
    console.log('After cleanup - keys:', Object.keys(opts));

    // Sign challenge into a token
    const challengeToken = signChallenge(opts.challenge, userId);

    res.json({ options: opts, challengeToken });
  } catch (error) {
    console.error('Passkey registration start error:', error);
    res.status(500).json({ error: 'Failed to start passkey registration' });
  }
});

// Verify registration
router.post('/passkey/register/verify', async (req: any, res: any) => {
  try {
    const { credential, challengeToken, name } = req.body;
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!challengeToken) return res.status(400).json({ error: 'Missing challenge token' });

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

    // Save passkey to database
    const passkey = await prisma.passkeys.create({
      data: {
        user_id: userId,
        credential_id: registrationInfo.credentialID,
        public_key: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'), // Store as base64 string
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

// Generate authentication options
router.post('/passkey/authenticate/start', async (req: any, res: any) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: [], // Allow any credential (discoverable/resident key flow)
    });

    const challengeToken = signChallenge(options.challenge);

    res.json({ options, challengeToken });
  } catch (error) {
    console.error('Passkey authentication start error:', error);
    res.status(500).json({ error: 'Failed to start passkey authentication' });
  }
});

// Verify authentication
router.post('/passkey/authenticate/verify', async (req: any, res: any) => {
  try {
    const { credential, challengeToken } = req.body;

    if (!challengeToken) return res.status(400).json({ error: 'Missing challenge token' });

    const decoded = verifyChallenge(challengeToken);
    if (!decoded) {
      return res.status(400).json({ error: 'Invalid or expired challenge token' });
    }

    // Find passkey by credential ID
    const passkey = await prisma.passkeys.findUnique({
      where: { credential_id: credential.id },
      include: { user: true },
    });

    if (!passkey) {
      return res.status(400).json({ error: 'Passkey not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: decoded.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: passkey.credential_id,
        credentialPublicKey: Buffer.from(passkey.public_key, 'base64'), // Decode from base64 string
        counter: passkey.sign_count,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Authentication failed' });
    }

    // Update sign count
    await prisma.passkeys.update({
      where: { id: passkey.id },
      data: {
        sign_count: verification.authenticationInfo.newCounter,
        last_used_at: new Date(),
      },
    });

    // Return user data (similar to login)
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
router.get('/passkeys', async (req: any, res: any) => {
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
router.delete('/passkeys/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const passkey = await prisma.passkeys.findFirst({
      where: { id, user_id: userId },
    });

    if (!passkey) {
      return res.status(404).json({ error: 'Passkey not found' });
    }

    await prisma.passkeys.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Passkey delete error:', error);
    res.status(500).json({ error: 'Failed to delete passkey' });
  }
});

export { router as passkeyRouter };
