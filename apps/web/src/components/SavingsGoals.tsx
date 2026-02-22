import { useState, useEffect } from 'react'
import { Target, Plus, Trash2 } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

const STORAGE_KEY = 'cashflow-savings-goals'

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
}

function loadGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (_) {}
  return [
    { id: '1', name: 'Emergency Fund', targetAmount: 5000, currentAmount: 1200, targetDate: '2025-12-31' },
    { id: '2', name: 'Vacation', targetAmount: 2000, currentAmount: 800, targetDate: '2025-08-01' },
  ]
}

function saveGoals(goals: SavingsGoal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export function SavingsGoals() {
  const { formatAmount } = useCurrency()
  const [goals, setGoals] = useState<SavingsGoal[]>(loadGoals)

  useEffect(() => {
    saveGoals(goals)
  }, [goals])

  const addGoal = () => {
    setGoals((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'New Goal',
        targetAmount: 1000,
        currentAmount: 0,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
    ])
  }

  const updateGoal = (id: string, field: keyof SavingsGoal, value: string | number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    )
  }

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Savings Goals
        </h2>
        <button
          onClick={addGoal}
          className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
        >
          <Plus className="h-4 w-4" /> Add goal
        </button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0
            ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
            : 0
          const days = daysUntil(goal.targetDate)
          const onTrack = days > 0 && goal.targetAmount > 0 && goal.currentAmount > 0
            ? goal.currentAmount / goal.targetAmount >= (1 - days / 365)
            : goal.currentAmount >= goal.targetAmount

          return (
            <div
              key={goal.id}
              className="p-4 rounded-lg border dark:border-gray-700 space-y-3"
            >
              <div className="flex justify-between items-start">
                <input
                  type="text"
                  value={goal.name}
                  onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
                  className="font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none flex-1 mr-2"
                />
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  aria-label="Remove goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Current / Target</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={goal.currentAmount || ''}
                      onChange={(e) =>
                        updateGoal(goal.id, 'currentAmount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={goal.targetAmount || ''}
                      onChange={(e) =>
                        updateGoal(goal.id, 'targetAmount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-xs text-gray-500">
                      {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Target date</label>
                  <input
                    type="date"
                    value={goal.targetDate}
                    onChange={(e) => updateGoal(goal.id, 'targetDate', e.target.value)}
                    className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>{progress.toFixed(0)}%</span>
                  <span className={onTrack ? 'text-green-600' : 'text-amber-600'}>
                    {days > 0 ? `${days} days left` : days === 0 ? 'Due today' : 'Overdue'}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
