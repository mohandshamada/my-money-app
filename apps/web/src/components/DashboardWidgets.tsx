import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { fetchTransactions } from '../store/transactionSlice'
import { RootState, AppDispatch } from '../store'

export function DashboardWidgets() {
  const dispatch = useDispatch<AppDispatch>()
  const { transactions, loading } = useSelector(
    (state: RootState) => state.transactions
  )

  useEffect(() => {
    dispatch(fetchTransactions())
  }, [dispatch])

  // Calculate stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const monthlyIncome = transactions
    .filter(t => new Date(t.date) >= startOfMonth && !t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const monthlyExpenses = transactions
    .filter(t => new Date(t.date) >= startOfMonth && t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = monthlyIncome - monthlyExpenses

  // Top spending categories
  const categorySpending = transactions
    .filter(t => new Date(t.date) >= startOfMonth && t.isExpense)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const widgets = [
    {
      title: 'Monthly Balance',
      value: `$${balance.toFixed(2)}`,
      icon: Wallet,
      trend: balance >= 0 ? 'positive' : 'negative',
      color: balance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: balance >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
    {
      title: 'Income',
      value: `$${monthlyIncome.toFixed(2)}`,
      icon: TrendingUp,
      trend: 'positive',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Expenses',
      value: `$${monthlyExpenses.toFixed(2)}`,
      icon: TrendingDown,
      trend: 'negative',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Transactions',
      value: transactions.length.toString(),
      icon: Calendar,
      trend: 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget) => (
          <div key={widget.title} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{widget.title}</p>
                <p className={`text-2xl font-bold ${widget.color}`}>{widget.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${widget.bgColor}`}>
                <widget.icon className={`h-6 w-6 ${widget.color}`} />
              </div>
            </div>
            {widget.trend !== 'neutral' && (
              <div className="mt-2 flex items-center gap-1">
                {widget.trend === 'positive' ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">This month</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">This month</span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {topCategories.map(([category, amount]) => {
              const percentage = monthlyExpenses > 0 
                ? (amount / monthlyExpenses) * 100 
                : 0
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}