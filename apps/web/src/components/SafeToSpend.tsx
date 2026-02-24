import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Wallet, Info } from 'lucide-react'
import { RootState } from '../store'
import { useCurrency } from '../contexts/CurrencyContext'

export function SafeToSpend() {
  const { formatAmount } = useCurrency()
  const { transactions, budgets } = useSelector((state: RootState) => ({
    transactions: state.transactions.transactions,
    budgets: state.budgets.budgets,
  }))

  const safeToSpend = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Calculate current balance (income - expenses)
    const currentBalance = transactions.reduce((acc, t) => {
      if (t.isExpense) {
        return acc - t.amount
      } else {
        return acc + t.amount
      }
    }, 0)
    
    // Upcoming bills (expenses from now to end of month)
    const upcomingBills = transactions
      .filter(t => {
        const txnDate = new Date(t.date)
        return t.isExpense && 
               txnDate > now && 
               txnDate <= endOfMonth
      })
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Active budget allocations for this month
    const budgetAllocations = budgets
      .reduce((sum, b) => sum + Number(b.amount || 0), 0)
    
    // Already spent this month
    const spentThisMonth = transactions
      .filter(t => {
        const txnDate = new Date(t.date)
        return t.isExpense && txnDate >= startOfMonth && txnDate <= now
      })
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Remaining budget
    const remainingBudget = budgetAllocations - spentThisMonth
    
    // Safe to spend = Current balance - upcoming bills - remaining budget
    return Math.max(0, currentBalance - upcomingBills - Math.max(0, remainingBudget))
  }, [transactions, budgets])

  const upcomingBillsTotal = useMemo(() => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return transactions
      .filter(t => {
        const txnDate = new Date(t.date)
        return t.isExpense && txnDate > now && txnDate <= endOfMonth
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-green-100 text-sm font-medium mb-1">Safe to Spend</p>
          <p className="text-4xl font-bold">{formatAmount(safeToSpend)}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-xl">
          <Wallet className="h-8 w-8" />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-100">Upcoming bills this month</span>
          <span className="font-medium">{formatAmount(upcomingBillsTotal)}</span>
        </div>
      </div>
      
      <div className="mt-3 flex items-start gap-2 text-xs text-green-100">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>This is what's left after upcoming bills and budget allocations.</p>
      </div>
    </div>
  )
}