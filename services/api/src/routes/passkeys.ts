// @ts-nocheck
import { Router } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { isoBase64URLToBuffer, isoBufferToBase64URLString } from '@simplewebauthn/server/helpers';

const router = Router();
const prisma = new PrismaClient();

// RP config - update with your actual domain
const rpName = 'My Money';
const rpID = process.env.WEBAUTHN_RP_ID || 'mymoney.mshousha.uk';
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;

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

    // Get existing passkey credential IDs
    const excludeCredentials = user.passkeys.map((pk) => ({
      id: pk.credential_id,
      type: 'public-key' as const,
      transports: ['internal'] as const,
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: user.email,
      userDisplayName: user.full_name || user.email,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
      },
    });

    // Store challenge in session/temp storage (simplified - use Redis in production)
    req.session = req.session || {};
    req.session.challenge = options.challenge;

    res.json(options);
  } catch (error) {
    console.error('Passkey registration start error:', error);
    res.status(500).json({ error: 'Failed to start passkey registration' });
  }
});

// Verify registration
router.post('/passkey/register/verify', async (req: any, res: any) => {
  try {
    const { credential, name } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const currentChallenge = req.session?.challenge;
    if (!currentChallenge) {
      return res.status(400).json({ error: 'No active registration' });
    }

    const verification = await verifyRegistrationResponse({
      credential,
      expectedChallenge: currentChallenge,
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
        public_key: registrationInfo.credentialPublicKey,
        sign_count: registrationInfo.counter,
        aaguid: registrationInfo.aaguid,
        name: name || 'Passkey',
        device_type: 'platform',
      },
    });

    // Clear challenge
    delete req.session.challenge;

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
    });

    req.session = req.session || {};
    req.session.challenge = options.challenge;

    res.json(options);
  } catch (error) {
    console.error('Passkey authentication start error:', error);
    res.status(500).json({ error: 'Failed to start passkey authentication' });
  }
});

// Verify authentication
router.post('/passkey/authenticate/verify', async (req: any, res: any) => {
  try {
    const { credential } = req.body;
    const currentChallenge = req.session?.challenge;

    if (!currentChallenge) {
      return res.status(400).json({ error: 'No active authentication' });
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
      credential,
      expectedChallenge: currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: passkey.credential_id,
        credentialPublicKey: passkey.public_key,
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

    // Clear challenge
    delete req.session.challenge;

    // Return user data (similar to login)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: passkey.user.id, email: passkey.user.email },
      process.env.JWT_SECRET || 'dev-secret',
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
