import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, 
  Award, Target, Zap, ShoppingBag, Coffee, Car, Home 
} from 'lucide-react'
import { RootState } from '../store'

interface MonthInReviewProps {
  isOpen: boolean
  onClose: () => void
}

export function MonthInReview({ isOpen, onClose }: MonthInReviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const transactions = useSelector((state: RootState) => state.transactions.transactions)


  const insights = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    // Ensure transactions is an array
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    
    // Filter transactions
    const thisMonthTx = safeTransactions.filter(t => t?.date && new Date(t.date) >= monthStart)
    const lastMonthTx = safeTransactions.filter(t => {
      const d = t?.date ? new Date(t.date) : null
      return d && d >= lastMonthStart && d < monthStart
    })
    
    // Calculate totals with safe number parsing
    const thisMonthIncome = thisMonthTx
      .filter(t => !(t?.isExpense || (t as any)?.is_expense))
      .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0)
    const thisMonthExpenses = thisMonthTx
      .filter(t => (t?.isExpense || (t as any)?.is_expense))
      .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0)
    
    const lastMonthExpenses = lastMonthTx
      .filter(t => (t?.isExpense || (t as any)?.is_expense))
      .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0)
    
    // Savings rate
    const savingsRate = thisMonthIncome > 0 
      ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100 
      : 0
    
    // Top categories
    const categorySpending: Record<string, number> = {}
    thisMonthTx.filter(t => t?.isExpense || (t as any)?.is_expense).forEach(t => {
      const category = t?.category || 'Other'
      categorySpending[category] = (categorySpending[category] || 0) + (Number(t?.amount) || 0)
    })
    
    const topCategory = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])[0] || ['None', 0]
    
    // Top merchant
    const merchantSpending: Record<string, number> = {}
    thisMonthTx.filter(t => t?.isExpense || (t as any)?.is_expense).forEach(t => {
      const key = t?.merchant || t?.description || 'Unknown'
      merchantSpending[key] = (merchantSpending[key] || 0) + (Number(t?.amount) || 0)
    })
    
    const topMerchant = Object.entries(merchantSpending)
      .sort((a, b) => b[1] - a[1])[0] || ['None', 0]
    
    // Month over month change
    const momChange = lastMonthExpenses > 0 
      ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0
    
    // Transaction count
    const transactionCount = thisMonthTx.length
    
    // Biggest expense
    const biggestExpense = thisMonthTx
      .filter(t => t?.isExpense || (t as any)?.is_expense)
      .sort((a, b) => (Number(b?.amount) || 0) - (Number(a?.amount) || 0))[0] || { amount: 0, merchant: 'None', description: '' }
    
    return {
      month: now.toLocaleDateString('en-US', { month: 'long' }),
      income: thisMonthIncome,
      expenses: thisMonthExpenses,
      savingsRate,
      topCategory,
      topMerchant,
      momChange,
      transactionCount,
      biggestExpense,
      isBetter: thisMonthExpenses <= lastMonthExpenses
    }
  }, [transactions])

  const slides = [
    // Slide 1: Title
    {
      title: `${insights.month} in Review`,
      subtitle: "Your financial month at a glance",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Award className="h-12 w-12 text-white" />
          </div>
          <div>
            <p className="text-5xl font-bold">{insights.transactionCount}</p>
            <p className="text-xl text-gray-500">transactions this month</p>
          </div>
        </div>
      )
    },
    // Slide 2: Spending Overview
    {
      title: "Spending Overview",
      subtitle: insights.isBetter ? "You spent less than last month! 🎉" : "Let's look at your spending",
      content: (
        <div className="space-y-6">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">${Number(insights.expenses || 0).toFixed(0)}</p>
              <p className="text-gray-500">Spent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">${Number(insights.income || 0).toFixed(0)}</p>
              <p className="text-gray-500">Earned</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${insights.isBetter ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <div className="flex items-center justify-center gap-2">
              {insights.isBetter ? <TrendingDown className="h-6 w-6 text-green-600" /> : <TrendingUp className="h-6 w-6 text-yellow-600" />}
              <p className={`font-medium ${insights.isBetter ? 'text-green-800' : 'text-yellow-800'}`}>
                {insights.isBetter ? 'Down' : 'Up'} {(Math.abs(insights.momChange) || 0).toFixed(1)}% from last month
              </p>
            </div>
          </div>
        </div>
      )
    },
    // Slide 3: Savings Rate
    {
      title: "Savings Rate",
      subtitle: "How much you kept vs. spent",
      content: (
        <div className="text-center space-y-6">
          <div className="relative w-40 h-40 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={insights.savingsRate >= 20 ? '#22c55e' : insights.savingsRate >= 10 ? '#eab308' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${insights.savingsRate}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-2xl font-bold">{Number(insights.savingsRate || 0).toFixed(0)}%</p>
            </div>
          </div>
          <p className="text-gray-500">
            {insights.savingsRate >= 20 
              ? "Excellent! You're saving more than 20%" 
              : insights.savingsRate >= 10 
                ? "Good progress! Aim for 20%"
                : "Try to increase your savings rate"}
          </p>
        </div>
      )
    },
    // Slide 4: Top Category
    {
      title: "Top Spending Category",
      subtitle: "Where most of your money went",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold capitalize">{insights.topCategory?.[0] || 'Unknown'}</p>
            <p className="text-xl text-gray-500">${Number(insights.topCategory?.[1] || 0).toFixed(0)}</p>
          </div>
        </div>
      )
    },
    // Slide 5: Top Merchant
    {
      title: "Top Merchant",
      subtitle: "Your most visited store",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
            <StoreIcon merchant={insights.topMerchant?.[0] || ''} />
          </div>
          <div>
            <p className="text-3xl font-bold">{insights.topMerchant?.[0] || 'Unknown'}</p>
            <p className="text-xl text-gray-500">${insights.topMerchant?.[1].toFixed(0) || 0} spent</p>
          </div>
        </div>
      )
    },
    // Slide 6: Biggest Expense
    {
      title: "Biggest Expense",
      subtitle: "Your largest single purchase",
      content: insights.biggestExpense ? (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
            <Zap className="h-12 w-12 text-white" />
          </div>
          <div>
            <p className="text-4xl font-bold text-red-500">${Number(insights.biggestExpense?.amount || 0).toFixed(2)}</p>
            <p className="text-xl">{insights.biggestExpense.merchant || insights.biggestExpense.description}</p>
            <p className="text-gray-500">{new Date(insights.biggestExpense.date).toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">No large expenses this month</p>
      )
    },
    // Slide 7: Summary
    {
      title: "Summary",
      subtitle: "Your month at a glance",
      content: (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-xl sm:text-2xl font-bold">${Number(insights.income || 0).toFixed(0)}</p>
            <p className="text-xs sm:text-sm text-gray-500">Income</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-xl sm:text-2xl font-bold">${Number(insights.expenses || 0).toFixed(0)}</p>
            <p className="text-xs sm:text-sm text-gray-500">Expenses</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-xl sm:text-2xl font-bold">{Number(insights.savingsRate || 0).toFixed(0)}%</p>
            <p className="text-xs sm:text-sm text-gray-500">Savings Rate</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-xl sm:text-2xl font-bold">{insights.transactionCount}</p>
            <p className="text-xs sm:text-sm text-gray-500">Transactions</p>
          </div>
        </div>
      )
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 text-center border-b flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold">{slides[currentSlide].title}</h2>
          <p className="text-sm sm:text-base text-gray-500">{slides[currentSlide].subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex items-center justify-center">
          {slides[currentSlide].content}
        </div>

        {/* Navigation */}
        <div className="p-4 sm:p-6 border-t space-y-4 flex-shrink-0">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all touch-target ${
                  i === currentSlide ? 'bg-primary-600 w-3 h-3 sm:w-6 sm:h-3' : 'bg-gray-300 w-2 h-2 sm:w-2 sm:h-2'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-2">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              aria-label="Previous slide"
              className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                aria-label="Next slide"
                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                aria-label="Close review"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for merchant icons
function StoreIcon({ merchant }: { merchant: string }) {
  const m = merchant.toLowerCase()
  
  if (m.includes('coffee') || m.includes('starbucks') || m.includes('cafe')) {
    return <Coffee className="h-12 w-12 text-white" />
  }
  if (m.includes('gas') || m.includes('shell') || m.includes('chevron')) {
    return <Car className="h-12 w-12 text-white" />
  }
  if (m.includes('grocery') || m.includes('walmart') || m.includes('target')) {
    return <Home className="h-12 w-12 text-white" />
  }
  if (m.includes('amazon') || m.includes('ebay') || m.includes('shop')) {
    return <ShoppingBag className="h-12 w-12 text-white" />
  }
  
  return <Target className="h-12 w-12 text-white" />
}