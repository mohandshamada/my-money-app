import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Flame, Trophy, Award, Target, TrendingDown, Calendar } from 'lucide-react'
import { RootState } from '../store'
import { useCurrency } from '../contexts/CurrencyContext'

const MILESTONES = [3, 7, 14, 30, 60, 90] as const

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalSaved: number
  daysUnderBudget: number
  daysTracked: number
}

export function SpendingStreaks() {
  const { transactions } = useSelector((state: RootState) => state.transactions)
  const { budgets } = useSelector((state: RootState) => state.budgets)
  const { formatAmount } = useCurrency()

  const streakData = useMemo(() => {
    if (!transactions.length) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalSaved: 0,
        daysUnderBudget: 0,
        daysTracked: 0,
        milestonesReached: [] as number[],
        recentDays: [] as { date: string; spent: number; budget: number; saved: number }[]
      }
    }

    // Calculate total monthly budget
    const monthlyBudgetTotal = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0)
    
    // Default daily budget if no budgets set (use average daily spending as baseline)
    const expenses = transactions.filter(t => t.isExpense || (t as any).is_expense)
    const avgDailySpending = expenses.length > 0
      ? expenses.reduce((sum, t) => sum + Number(t.amount), 0) / expenses.length
      : 0
    
    const defaultDailyBudget = monthlyBudgetTotal > 0 
      ? monthlyBudgetTotal / 30 
      : avgDailySpending * 0.9 // Default to 10% less than average

    // Group expenses by day
    const byDay = new Map<string, number>()
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    transactions.forEach((t) => {
      if (!t.isExpense && !(t as any).is_expense) return
      const txnDate = new Date(t.date)
      if (txnDate < thirtyDaysAgo) return // Only look at last 30 days
      
      const day = txnDate.toISOString().slice(0, 10)
      byDay.set(day, (byDay.get(day) ?? 0) + Number(t.amount || 0))
    })

    // Build streak data
    const sortedDays = Array.from(byDay.keys()).sort()
    const todayStr = today.toISOString().slice(0, 10)
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let totalSaved = 0
    let daysUnderBudget = 0
    const recentDays: { date: string; spent: number; budget: number; saved: number }[] = []

    // Calculate from most recent to oldest
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i]
      const spent = byDay.get(day) ?? 0
      const dailyBudget = monthlyBudgetTotal > 0 
        ? monthlyBudgetTotal / new Date(day).getDate() // Pro-rated for month
        : defaultDailyBudget
      
      const saved = Math.max(0, dailyBudget - spent)
      
      recentDays.push({ date: day, spent, budget: dailyBudget, saved })
      
      if (spent <= dailyBudget) {
        daysUnderBudget++
        totalSaved += saved
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
        
        // Count current streak only if it's today or consecutive days
        if (i === sortedDays.length - 1 || day === todayStr || tempStreak > 0) {
          if (i === sortedDays.length - 1) currentStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    }

    // If no transaction today, check yesterday for current streak
    if (!byDay.has(todayStr) && sortedDays.length > 0) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)
      
      if (byDay.has(yesterdayStr)) {
        // Count consecutive days ending yesterday
        let streak = 0
        for (let i = 0; i < 90; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(checkDate.getDate() - 1 - i)
          const checkStr = checkDate.toISOString().slice(0, 10)
          
          if (byDay.has(checkStr)) {
            const spent = byDay.get(checkStr) ?? 0
            const dailyBudget = monthlyBudgetTotal > 0 
              ? monthlyBudgetTotal / 30
              : defaultDailyBudget
            if (spent <= dailyBudget) {
              streak++
            } else {
              break
            }
          } else {
            break
          }
        }
        currentStreak = streak
      }
    }

    // Determine milestones reached
    const milestonesReached = MILESTONES.filter(m => longestStreak >= m || currentStreak >= m)

    return {
      currentStreak,
      longestStreak,
      totalSaved,
      daysUnderBudget,
      daysTracked: sortedDays.length,
      milestonesReached,
      recentDays: recentDays.slice(0, 7).reverse() // Last 7 days
    }
  }, [transactions, budgets])

  const {
    currentStreak,
    longestStreak,
    totalSaved,
    daysUnderBudget,
    daysTracked,
    milestonesReached,
    recentDays
  } = streakData

  const nextMilestone = MILESTONES.find(m => m > currentStreak) || 100
  const progress = Math.min(100, (currentStreak / nextMilestone) * 100)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-500" />
          Spending Streaks
        </h2>
        {currentStreak > 0 && (
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Flame className="h-4 w-4" />
            {currentStreak} days!
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <p className="text-2xl font-bold text-amber-600">{currentStreak}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Current Streak</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{longestStreak}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Best Streak</p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <p className="text-2xl font-bold text-green-600">{formatAmount(totalSaved)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Saved</p>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {currentStreak > 0 && nextMilestone < 100 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress to {nextMilestone} days</span>
            <span className="font-medium text-amber-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Milestones</p>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.slice(0, 6).map((days) => {
            const reached = milestonesReached.includes(days)
            const isNext = days === nextMilestone
            return (
              <div
                key={days}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                  reached
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 shadow-sm'
                    : isNext
                    ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {reached ? (
                  <Trophy className="h-3.5 w-3.5 text-amber-600" />
                ) : (
                  <Award className="h-3.5 w-3.5" />
                )}
                <span className="font-medium">{days}d</span>
                {reached && <span className="text-amber-600">✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Days */}
      {recentDays.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last 7 Days</p>
          <div className="space-y-1">
            {recentDays.map((day) => {
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const isUnderBudget = day.spent <= day.budget
              
              return (
                <div key={day.date} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8">{dayName}</span>
                    <div className={`w-2 h-2 rounded-full ${isUnderBudget ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Spent: {formatAmount(day.spent)}
                    </span>
                    {day.saved > 0 && (
                      <span className="text-green-600">
                        Saved: {formatAmount(day.saved)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Encouragement Messages */}
      <div className="space-y-2">
        {currentStreak === 0 && transactions.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Start a new streak today! Stay under budget to begin.
          </p>
        )}
        
        {currentStreak > 0 && currentStreak < 7 && (
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            🔥 Keep it up! You're building a great habit.
          </p>
        )}
        
        {currentStreak >= 7 && currentStreak < 30 && (
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            🎉 One week down! You're crushing your budget goals.
          </p>
        )}
        
        {currentStreak >= 30 && (
          <p className="text-sm text-green-700 dark:text-green-400 font-bold">
            🌟 Incredible! A full month under budget. You're a savings champion!
          </p>
        )}
        
        {totalSaved > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            You've saved {formatAmount(totalSaved)} during your streak!
          </p>
        )}
      </div>

      {!transactions.length ? (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add transactions and set budgets to start tracking your streak.
          </p>
        </div>
      ) : null}
    </div>
  )
}
