import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import express from 'express';

const router = Router();
const prisma = new PrismaClient();

// Placeholder for Stripe API Key. You will set this in your environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover' as any,
});

const YOUR_DOMAIN = process.env.FRONTEND_URL || 'https://mymoney.mshousha.uk';

router.post('/create-checkout-session', authMiddleware as any, async (req: any, res: any) => {
  try {
    const { priceId, tier } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get user details
    const user = await prisma.users.findUnique({ where: { id: userId } });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${YOUR_DOMAIN}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/settings?canceled=true`,
      customer_email: user?.email,
      client_reference_id: userId,
      metadata: {
        tier: tier // e.g. 'premium', 'standard'
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook Endpoint
// IMPORTANT: This needs the raw body to verify the signature.
router.post('/webhook', express.raw({type: 'application/json'}), async (req: any, res: any) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const tier = session.metadata?.tier || 'standard';

        if (userId) {
          // Update user tier in database
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1); // Add 1 month

          await prisma.user_settings.upsert({
            where: { user_id: userId },
            create: { 
              user_id: userId, 
              subscription_tier: tier,
              subscription_expires_at: expiresAt 
            },
            update: { 
              subscription_tier: tier,
              subscription_expires_at: expiresAt
            }
          });
          console.log(`Updated user ${userId} to tier ${tier}`);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        // Handled in a real app
        break;
      }
      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).end();
  }
});

export default router;
