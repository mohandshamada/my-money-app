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
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Microsoft OAuth
router.get('/microsoft',
  passport.authenticate('microsoft', { scope: ['user.read', 'email', 'profile'] })
);

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Apple OAuth
router.get('/apple',
  passport.authenticate('apple')
);

router.post('/apple/callback',
  passport.authenticate('apple', { session: false, failureRedirect: '/login' }),
  handleCallback
);

// Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

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
