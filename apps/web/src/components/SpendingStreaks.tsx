import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Flame, Trophy, Award } from 'lucide-react'
import { RootState } from '../store'

const MILESTONES = [7, 30, 90] as const
const MILESTONE_LABELS: Record<number, string> = {
  7: 'One week strong!',
  30: 'Monthly master',
  90: 'Quarter champion',
}

export function SpendingStreaks() {
  const { transactions } = useSelector((state: RootState) => state.transactions)
  const { budgets } = useSelector((state: RootState) => state.budgets)

  const { currentStreak, longestStreak, milestonesReached } = useMemo(() => {
    if (!transactions.length || !budgets.length) {
      return { currentStreak: 0, longestStreak: 0, milestonesReached: [] as number[] }
    }

    const monthlyBudgetTotal = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0)
    const byDay = new Map<string, number>()
    transactions.forEach((t) => {
      if (!t.isExpense) return
      const day = new Date(t.date).toISOString().slice(0, 10)
      byDay.set(day, (byDay.get(day) ?? 0) + t.amount)
    })

    const getDailyBudget = (dateStr: string) => {
      const d = new Date(dateStr)
      const year = d.getFullYear()
      const month = d.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      return monthlyBudgetTotal / daysInMonth
    }

    const today = new Date().toISOString().slice(0, 10)
    const sortedDays = Array.from(byDay.keys()).filter((d) => d <= today).sort()
    let currentStreak = 0
    let longestStreak = 0
    let run = 0
    const reached = new Set<number>()

    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i]
      const spent = byDay.get(day) ?? 0
      const dailyBudget = getDailyBudget(day)
      const underBudget = dailyBudget > 0 && spent <= dailyBudget
      if (underBudget) {
        run++
        longestStreak = Math.max(longestStreak, run)
        if ((MILESTONES as readonly number[]).includes(run)) reached.add(run)
        if (day === today) currentStreak = run
      } else {
        if (day === today) currentStreak = 0
        run = 0
      }
    }

    if (currentStreak === 0 && sortedDays[sortedDays.length - 1] !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)
      if (sortedDays.includes(yesterdayStr)) {
        const spent = byDay.get(yesterdayStr) ?? 0
        const dailyBudget = getDailyBudget(yesterdayStr)
        if (dailyBudget > 0 && spent <= dailyBudget) {
          let runBack = 0
          for (let i = sortedDays.length - 1; i >= 0; i--) {
            const d = sortedDays[i]
            const s = byDay.get(d) ?? 0
            const b = getDailyBudget(d)
            if (b > 0 && s <= b) runBack++
            else break
          }
          currentStreak = runBack
        }
      }
    }

    return {
      currentStreak,
      longestStreak,
      milestonesReached: MILESTONES.filter((m) => m <= longestStreak || m <= currentStreak),
    }
  }, [transactions, budgets])

  return (
    <div className="card">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-amber-500" />
        Spending Streaks
      </h2>

      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary-600">{currentStreak}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Days under budget</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{longestStreak}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Longest streak</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestones</p>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((days) => {
            const reached = milestonesReached.includes(days)
            return (
              <div
                key={days}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  reached
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {reached ? (
                  <Trophy className="h-4 w-4 text-amber-600" />
                ) : (
                  <Award className="h-4 w-4" />
                )}
                <span className="font-medium">{days} days</span>
                {reached && <span className="text-xs">✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Celebrate milestones */}
      {currentStreak > 0 && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-2">
          {currentStreak >= 7 && (
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
              🎉 Great job staying under budget!
            </p>
          )}
          {MILESTONES.filter((m) => currentStreak >= m).map((m) => (
            <p key={m} className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {m} days: {MILESTONE_LABELS[m]} ✓
            </p>
          ))}
          {currentStreak >= 90 && (
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              🌟 Amazing! You've been under budget for 90+ days. You're a savings superstar!
            </p>
          )}
        </div>
      )}
      {!transactions.length || !budgets.length ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Add transactions and set up budgets to start your streak.
        </p>
      ) : null}
    </div>
  )
}
