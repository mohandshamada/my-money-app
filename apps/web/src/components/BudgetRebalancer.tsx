import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { 
  AlertCircle, ArrowRight, CheckCircle, X, 
  TrendingDown, TrendingUp, RefreshCw, Lightbulb 
} from 'lucide-react'
import { RootState } from '../store'

interface BudgetRebalancerProps {
  isOpen: boolean
  onClose: () => void
}

interface RebalanceSuggestion {
  fromCategory: string
  toCategory: string
  amount: number
  fromSurplus: number
  toDeficit: number
}

export function BudgetRebalancer({ isOpen, onClose }: BudgetRebalancerProps) {
  const transactions = useSelector((state: RootState) => state.transactions.transactions)
  const budgets = useSelector((state: RootState) => state.budgets.budgets)
  const [applying, setApplying] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    if (!budgets.length || !transactions.length) return []

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Calculate spending per category
    const categorySpending: Record<string, number> = {}
    transactions
      .filter(t => t.isExpense && new Date(t.date) >= monthStart)
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
      })

    // Calculate budget status
    const budgetStatus = budgets.map(b => {
      const spent = categorySpending[b.category] || 0
      const remaining = Number(b.amount) - spent
      const percentUsed = (spent / Number(b.amount)) * 100
      
      return {
        category: b.category,
        budget: Number(b.amount),
        spent,
        remaining,
        percentUsed,
        isOverBudget: remaining < 0,
        isUnderBudget: remaining > Number(b.amount) * 0.3 // 30%+ remaining
      }
    })

    // Find suggestions
    const overBudget = budgetStatus.filter(b => b.isOverBudget)
    const underBudget = budgetStatus.filter(b => b.isUnderBudget && b.remaining > 50)

    const rebalanceSuggestions: RebalanceSuggestion[] = []

    overBudget.forEach(over => {
      const deficit = Math.abs(over.remaining)
      
      // Find best source to borrow from
      const sources = underBudget
        .filter(under => under.category !== over.category)
        .sort((a, b) => b.remaining - a.remaining)

      if (sources.length > 0) {
        const source = sources[0]
        const amountToTransfer = Math.min(deficit, source.remaining * 0.5) // Don't take more than 50%

        if (amountToTransfer >= 20) { // Only suggest if meaningful
          rebalanceSuggestions.push({
            fromCategory: source.category,
            toCategory: over.category,
            amount: amountToTransfer,
            fromSurplus: source.remaining,
            toDeficit: deficit
          })
        }
      }
    })

    return rebalanceSuggestions
  }, [budgets, transactions])

  const applyRebalance = async (suggestion: RebalanceSuggestion) => {
    setApplying(suggestion.toCategory)
    
    // In production, this would update budget amounts in the database
    // For now, we'll just simulate
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setApplying(null)
    // Would dispatch budget update action here
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Smart Budget Rebalancing</h2>
              <p className="text-sm text-gray-500">AI-powered budget optimization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">All Budgets Balanced!</h3>
              <p className="text-gray-500 mt-2">
                You're on track this month. No rebalancing needed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Found {suggestions.length} opportunities to optimize your budget. 
                  These suggestions transfer funds from under-spent categories to cover overspending.
                </p>
              </div>

              {suggestions.map((suggestion, idx) => (
                <div 
                  key={idx}
                  className="p-4 border rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                          {suggestion.fromCategory}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium capitalize">
                          {suggestion.toCategory}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold">${suggestion.amount.toFixed(0)}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {suggestion.fromCategory} surplus
                      </span>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingDown className="h-4 w-4" />
                        ${suggestion.fromSurplus.toFixed(0)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {suggestion.toCategory} deficit
                      </span>
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingUp className="h-4 w-4" />
                        ${suggestion.toDeficit.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => applyRebalance(suggestion)}
                    disabled={applying !== null}
                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {applying === suggestion.toCategory ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Apply Rebalance
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-xs text-gray-500 text-center">
            Suggestions are based on your current spending patterns and remaining budget.
            Changes won't affect past transactions.
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook to check if rebalancing is needed
export function useBudgetAlert() {
  const transactions = useSelector((state: RootState) => state.transactions.transactions)
  const budgets = useSelector((state: RootState) => state.budgets.budgets)

  return useMemo(() => {
    if (!budgets.length || !transactions.length) return null

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const categorySpending: Record<string, number> = {}
    transactions
      .filter(t => t.isExpense && new Date(t.date) >= monthStart)
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
      })

    const overBudgetCount = budgets.filter(b => {
      const spent = categorySpending[b.category] || 0
      return spent > Number(b.amount)
    }).length

    if (overBudgetCount > 0) {
      return {
        type: 'warning',
        message: `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''} over limit`,
        showRebalancer: true
      }
    }

    return null
  }, [budgets, transactions])
}