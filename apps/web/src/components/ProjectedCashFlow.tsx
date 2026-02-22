import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { RootState } from '../store'

export function ProjectedCashFlow() {
  const transactions = useSelector((state: RootState) => state.transactions.transactions)

  // Generate 90-day projection
  const projection = useMemo(() => {
    const today = new Date()
    const dailyBalances: { date: Date; balance: number; income: number; expenses: number }[] = []
    
    // Calculate current balance
    let currentBalance = transactions.reduce((acc, t) => {
      return t.isExpense ? acc - t.amount : acc + t.amount
    }, 0)
    
    // Get recurring patterns from past transactions
    const recurringIncome = getRecurringAmount(transactions, false)
    const recurringExpenses = getRecurringAmount(transactions, true)
    
    // Generate 90 days of projections
    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      // Add recurring transactions
      const dayIncome = getDayIncome(date, recurringIncome, transactions)
      const dayExpenses = getDayExpenses(date, recurringExpenses, transactions)
      
      currentBalance = currentBalance + dayIncome - dayExpenses
      
      dailyBalances.push({
        date,
        balance: currentBalance,
        income: dayIncome,
        expenses: dayExpenses,
      })
    }
    
    return dailyBalances
  }, [transactions])

  // Find minimum balance and when
  const minBalance = useMemo(() => {
    return projection.reduce((min, day) => day.balance < min.balance ? day : min, projection[0])
  }, [projection])

  // Check for negative balance warning
  const hasNegativeProjection = useMemo(() => {
    return projection.some(day => day.balance < 0)
  }, [projection])

  // Calculate trend
  const trend = useMemo(() => {
    if (projection.length < 2) return 0
    const start = projection[0].balance
    const end = projection[projection.length - 1].balance
    return ((end - start) / Math.abs(start || 1)) * 100
  }, [projection])

  // Simple SVG chart
  const chartData = useMemo(() => {
    if (projection.length === 0) return { points: '', min: 0, max: 0 }
    
    const balances = projection.map(p => p.balance)
    const min = Math.min(...balances, 0)
    const max = Math.max(...balances)
    const range = max - min || 1
    
    const points = projection.map((p, i) => {
      const x = (i / (projection.length - 1)) * 100
      const y = 100 - ((p.balance - min) / range) * 100
      return `${x},${y}`
    }).join(' ')
    
    return { points, min, max }
  }, [projection])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Projected Cash Flow
          </h3>
          <p className="text-sm text-gray-500">90-day forecast based on recurring transactions</p>
        </div>
        
        <div className="text-right">
          <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">90-day trend</p>
        </div>
      </div>

      {/* Warnings */}
      {hasNegativeProjection && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Warning: Negative Balance Projected</p>
            <p className="text-sm text-red-600">
              Your balance may drop below $0 around {' '}
              {minBalance?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
              Consider adjusting spending or adding income.
            </p>
          </div>
        </div>
      )}

      {/* Simple Chart */}
      <div className="relative h-48 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Zero line */}
          {chartData.min < 0 && (
            <line
              x1="0"
              y1={100 - ((0 - chartData.min) / (chartData.max - chartData.min || 1)) * 100}
              x2="100"
              y2={100 - ((0 - chartData.min) / (chartData.max - chartData.min || 1)) * 100}
              stroke="#ef4444"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          )}
          
          {/* Balance line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={chartData.points}
          />
          
          {/* Area under curve */}
          <polygon
            fill="rgba(59, 130, 246, 0.1)"
            points={`0,100 ${chartData.points} 100,100`}
          />
        </svg>
        
        {/* Labels */}
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          ${chartData.max.toFixed(0)}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          ${chartData.min.toFixed(0)}
        </div>
      </div>

      {/* Key Dates */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Calendar className="h-5 w-5 mx-auto mb-1 text-gray-400" />
          <p className="text-sm text-gray-500">30 Days</p>
          <p className="font-semibold">${projection[29]?.balance.toFixed(0) || '0'}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Calendar className="h-5 w-5 mx-auto mb-1 text-gray-400" />
          <p className="text-sm text-gray-500">60 Days</p>
          <p className="font-semibold">${projection[59]?.balance.toFixed(0) || '0'}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Calendar className="h-5 w-5 mx-auto mb-1 text-gray-400" />
          <p className="text-sm text-gray-500">90 Days</p>
          <p className="font-semibold">${projection[89]?.balance.toFixed(0) || '0'}</p>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getRecurringAmount(transactions: any[], isExpense: boolean): number {
  const relevant = transactions.filter(t => t.isExpense === isExpense)
  if (relevant.length === 0) return 0
  
  // Group by month and calculate average
  const monthlyTotals: Record<string, number> = {}
  relevant.forEach(t => {
    const month = t.date.substring(0, 7) // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount
  })
  
  const months = Object.values(monthlyTotals)
  return months.reduce((a, b) => a + b, 0) / months.length
}

function getDayIncome(_date: Date, recurringIncome: number, _transactions: any[]): number {
  // Daily income approximation
  return recurringIncome / 30
}

function getDayExpenses(date: Date, recurringExpenses: number, transactions: any[]): number {
  // Check for specific due dates in transactions
  const dateStr = date.toISOString().split('T')[0]
  const dueToday = transactions.filter(t => 
    t.isExpense && t.date === dateStr
  )
  
  if (dueToday.length > 0) {
    return dueToday.reduce((sum, t) => sum + t.amount, 0)
  }
  
  // Daily expense approximation
  return recurringExpenses / 30
}