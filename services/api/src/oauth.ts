// @ts-nocheck
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy, Profile as MicrosoftProfile } from 'passport-microsoft';
import { Strategy as AppleStrategy } from 'passport-apple';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Serialize/deserialize user
passport.serializeUser((user: any, done: (err: any, id?: string) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await prisma.users.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Generate random password for OAuth users
function generateRandomPassword(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Common OAuth callback handler
async function handleOAuthCallback(
  provider: 'google' | 'microsoft' | 'apple' | 'facebook',
  profile: any,
  done: (err: any, user?: any) => void
) {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email provided from OAuth provider'));
    }

    // Check if user exists
    let user = await prisma.users.findUnique({
      where: { email },
    });

    if (user) {
      // Update OAuth provider if not set
      const providerField = `${provider}Id` as keyof typeof user;
      if (!user[providerField]) {
        const updateData: any = {};
        updateData[providerField] = profile.id;
        await prisma.users.update({
          where: { id: user.id },
          data: updateData,
        });
      }
      return done(null, user);
    }

    // Create new user
    const userData: any = {
      email,
      full_name: profile.displayName || (profile.name?.givenName + ' ' + profile.name?.familyName),
      avatar_url: profile.photos?.[0]?.value,
      password_hash: generateRandomPassword(),
      email_verified: true,
      updated_at: new Date(),
    };
    userData[`${provider}_id`] = profile.id;
    
    user = await prisma.users.create({ data: userData });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: (err: any, user?: any) => void
      ) => {
        await handleOAuthCallback('google', profile, done);
      }
    )
  );
}

// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: '/auth/microsoft/callback',
        scope: ['user.read', 'email', 'profile'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: MicrosoftProfile,
        done: (err: any, user?: any) => void
      ) => {
        await handleOAuthCallback('microsoft', profile, done);
      }
    )
  );
}

// Apple Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        callbackURL: '/auth/apple/callback',
        keyID: process.env.APPLE_KEY_ID || '',
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH || '',
        scope: ['name', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: (err: any, user?: any) => void
      ) => {
        await handleOAuthCallback('apple', profile, done);
      }
    )
  );
}

// Facebook Strategy
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: FacebookProfile,
        done: (err: any, user?: any) => void
      ) => {
        await handleOAuthCallback('facebook', profile, done);
      }
    )
  );
}

export default passport;
