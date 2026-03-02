import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Get all subscriptions for current user
router.get('/', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const subscriptions = await prisma.subscriptions.findMany({
      where: { user_id: userId },
      orderBy: { next_billing: 'asc' }
    })

    res.json({ subscriptions })
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error)
    res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
})

// Create a new subscription
router.post('/', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, amount, currency, frequency, nextBilling, category, autoRenew } = req.body

    if (!name || !amount || !nextBilling) {
      return res.status(400).json({ error: 'Missing required fields: name, amount, nextBilling' })
    }

    const subscription = await prisma.subscriptions.create({
      data: {
        user_id: userId,
        name,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        frequency: frequency || 'monthly',
        next_billing: new Date(nextBilling),
        category,
        auto_renew: autoRenew !== false
      }
    })

    res.status(201).json({ subscription })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    res.status(500).json({ error: 'Failed to create subscription' })
  }
})

// Update a subscription
router.put('/:id', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify ownership
    const existing = await prisma.subscriptions.findFirst({
      where: { id, user_id: userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    const { name, amount, currency, frequency, nextBilling, category, autoRenew } = req.body

    const subscription = await prisma.subscriptions.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(frequency && { frequency }),
        ...(nextBilling && { next_billing: new Date(nextBilling) }),
        ...(category !== undefined && { category }),
        ...(autoRenew !== undefined && { auto_renew: autoRenew }),
        updated_at: new Date()
      }
    })

    res.json({ subscription })
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    res.status(500).json({ error: 'Failed to update subscription' })
  }
})

// Delete a subscription
router.delete('/:id', authMiddleware as any, async (req: any, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify ownership
    const existing = await prisma.subscriptions.findFirst({
      where: { id, user_id: userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    await prisma.subscriptions.delete({
      where: { id }
    })

    res.json({ success: true, message: 'Subscription deleted' })
  } catch (error: any) {
    console.error('Error deleting subscription:', error)
    res.status(500).json({ error: 'Failed to delete subscription' })
  }
})

export default router
