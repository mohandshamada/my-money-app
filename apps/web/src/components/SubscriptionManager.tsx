import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  
  Trash2, 
  Edit2, 
  Plus,
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { RootState } from '../store'

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'yearly' | 'weekly'
  nextBilling: string
  category: string
  autoRenew: boolean
}

const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', name: 'Streaming', icon: '🎬' },
  { id: 'software', name: 'Software', icon: '💻' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'other', name: 'Other', icon: '📦' },
]

export function SubscriptionManager() {
  const transactions = useSelector((state: RootState) => state.transactions.transactions)
  // const [showAddModal, setShowAddModal] = useState(false)
  // const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  // Auto-detect subscriptions from transactions
  const detectedSubscriptions = useMemo(() => {
    const potentialSubs = transactions
      .filter(t => t.isExpense && (t.merchant || t.description))
      .reduce((acc, t) => {
        const key = (t.merchant || t.description || '').toLowerCase()
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(t)
        return acc
      }, {} as Record<string, typeof transactions>)

    // Find merchants with 2+ transactions of similar amounts
    return Object.entries(potentialSubs)
      .filter(([, txns]) => txns.length >= 2)
      .map(([name, txns]) => ({
        id: `auto-${name}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        amount: txns[0].amount,
        frequency: 'monthly' as const,
        nextBilling: calculateNextBilling(txns),
        category: detectCategory(name),
        autoRenew: true,
        isDetected: true,
      }))
      .slice(0, 10) // Top 10 potential subscriptions
  }, [transactions])

  // Mock subscriptions (in real app, these would come from database)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      name: 'Netflix',
      amount: 15.99,
      frequency: 'monthly',
      nextBilling: '2026-03-15',
      category: 'streaming',
      autoRenew: true,
    },
    {
      id: '2',
      name: 'Spotify',
      amount: 9.99,
      frequency: 'monthly',
      nextBilling: '2026-03-08',
      category: 'music',
      autoRenew: true,
    },
  ])

  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((sum, sub) => {
      const monthlyAmount = sub.frequency === 'yearly' 
        ? sub.amount / 12 
        : sub.frequency === 'weekly'
        ? sub.amount * 4.33
        : sub.amount
      return sum + monthlyAmount
    }, 0)
  }, [subscriptions])

  const yearlyTotal = monthlyTotal * 12

  const upcomingRenewals = useMemo(() => {
    const today = new Date()
    const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return subscriptions.filter(sub => {
      const billingDate = new Date(sub.nextBilling)
      return billingDate >= today && billingDate <= sevenDays
    })
  }, [subscriptions])

  const handleDelete = (id: string) => {
    if (confirm('Delete this subscription?')) {
      setSubscriptions(subs => subs.filter(s => s.id !== id))
    }
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'monthly': return '/mo'
      case 'yearly': return '/yr'
      case 'weekly': return '/wk'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-sm">Monthly Subscriptions</p>
          <p className="text-2xl font-bold">${monthlyTotal.toFixed(2)}</p>
          <p className="text-purple-100 text-sm">{subscriptions.length} active</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-orange-100 text-sm">Yearly Cost</p>
          <p className="text-2xl font-bold">${yearlyTotal.toFixed(2)}</p>
          <p className="text-orange-100 text-sm">What you pay annually</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-4 text-white">
          <p className="text-green-100 text-sm">Upcoming (7 days)</p>
          <p className="text-2xl font-bold">{upcomingRenewals.length}</p>
          <p className="text-green-100 text-sm">renewals due</p>
        </div>
      </div>

      {/* Upcoming Renewals Alert */}
      {upcomingRenewals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Upcoming Renewals</h3>
          </div>
          <div className="space-y-2">
            {upcomingRenewals.map(sub => (
              <div key={sub.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{sub.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${sub.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{new Date(sub.nextBilling).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Subscriptions</h3>
          <button
            onClick={() => {/* setShowAddModal(true) */}}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {subscriptions.map(sub => {
            const category = SUBSCRIPTION_CATEGORIES.find(c => c.id === sub.category)
            return (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category?.icon || '📦'}</span>
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-sm text-gray-500">
                      Next: {new Date(sub.nextBilling).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">${sub.amount.toFixed(2)}{getFrequencyLabel(sub.frequency)}</p>
                    {sub.autoRenew && (
                      <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle className="h-3 w-3" /> Auto-renews
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {/* setEditingSub(sub) */}}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Auto-Detected Subscriptions */}
      {detectedSubscriptions.length > 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-semibold mb-4">Potential Subscriptions Detected</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Based on your transaction history, we found these recurring payments.
          </p>
          <div className="space-y-2">
            {detectedSubscriptions.slice(0, 5).map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sub.category ? SUBSCRIPTION_CATEGORIES.find(c => c.id === sub.category)?.icon : '💳'}</span>
                  <span>{sub.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">~${sub.amount.toFixed(2)}/mo</span>
                  <button
                    onClick={() => {
                      setSubscriptions([...subscriptions, { ...sub, id: Date.now().toString() }])
                    }}
                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function calculateNextBilling(transactions: any[]) {
  const sorted = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const lastDate = new Date(sorted[0].date)
  lastDate.setMonth(lastDate.getMonth() + 1)
  return lastDate.toISOString().split('T')[0]
}

function detectCategory(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('netflix') || lower.includes('hulu') || lower.includes('disney') || lower.includes('hbo')) return 'streaming'
  if (lower.includes('spotify') || lower.includes('apple music') || lower.includes('youtube')) return 'music'
  if (lower.includes('adobe') || lower.includes('microsoft') || lower.includes('notion')) return 'software'
  if (lower.includes('gym') || lower.includes('fitness')) return 'fitness'
  return 'other'
}