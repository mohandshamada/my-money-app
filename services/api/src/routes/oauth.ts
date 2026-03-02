// @ts-nocheck
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../oauth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mymoney.mshousha.uk';

// Helper to generate JWT token
function generateToken(user: any) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
}

// Helper to handle OAuth callback
function handleCallback(req: any, res: any) {
  const user = req.user;
  if (!user) {
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }

  const token = generateToken(user);
  
  // Redirect to frontend with token
  res.redirect(`${FRONTEND_URL}/oauth/callback?token=${token}`);
}

// Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ 
      error: 'Google OAuth not configured',
      message: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file',
      setup: 'https://console.cloud.google.com/apis/credentials'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Microsoft OAuth
router.get('/microsoft', (req, res, next) => {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return res.status(501).json({ 
      error: 'Microsoft OAuth not configured',
      message: 'Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env file',
      setup: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade'
    });
  }
  passport.authenticate('microsoft', { scope: ['user.read', 'email', 'profile'] })(req, res, next);
});

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Apple OAuth
router.get('/apple', (req, res, next) => {
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID) {
    return res.status(501).json({ 
      error: 'Apple OAuth not configured',
      message: 'Add APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID to .env file',
      setup: 'https://developer.apple.com/account/resources/identifiers/list'
    });
  }
  passport.authenticate('apple')(req, res, next);
});

router.post('/apple/callback',
  passport.authenticate('apple', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Facebook OAuth
router.get('/facebook', (req, res, next) => {
  if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
    return res.status(501).json({ 
      error: 'Facebook OAuth not configured',
      message: 'Add FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET to .env file',
      setup: 'https://developers.facebook.com/apps/'
    });
  }
  passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
});

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Get available OAuth providers
router.get('/providers', (req, res) => {
  const providers = [];
  
  if (process.env.GOOGLE_CLIENT_ID) {
    providers.push({ id: 'google', name: 'Google', icon: 'google' });
  }
  if (process.env.MICROSOFT_CLIENT_ID) {
    providers.push({ id: 'microsoft', name: 'Microsoft', icon: 'microsoft' });
  }
  if (process.env.APPLE_CLIENT_ID) {
    providers.push({ id: 'apple', name: 'Apple', icon: 'apple' });
  }
  if (process.env.FACEBOOK_CLIENT_ID) {
    providers.push({ id: 'facebook', name: 'Facebook', icon: 'facebook' });
  }
  
  res.json({ providers });
});

export { router as oauthRouter };
