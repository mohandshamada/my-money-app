import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export function YoYComparison() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchYoY()
  }, [])

  const fetchYoY = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_URL}/api/alerts/yoy-comparison`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch YoY:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatChange = (amount: number, percent: number) => {
    const sign = amount >= 0 ? '+' : ''
    return `${sign}${formatCurrency(amount)} (${percent > 0 ? '+' : ''}${percent}%)`
  }

  const getTrendIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (amount < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-lg">Year-over-Year</h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Comparing {data.thisMonth.month} vs {data.lastYear.month}
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Income</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{formatCurrency(data.thisMonth.income)}</p>
            {getTrendIcon(data.changes.income.amount)}
          </div>
          <p className={`text-xs mt-1 ${data.changes.income.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatChange(data.changes.income.amount, data.changes.income.percent)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{formatCurrency(data.thisMonth.expenses)}</p>
            {getTrendIcon(-data.changes.expenses.amount)}
          </div>
          <p className={`text-xs mt-1 ${data.changes.expenses.amount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatChange(data.changes.expenses.amount, data.changes.expenses.percent)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{formatCurrency(data.thisMonth.net)}</p>
            {getTrendIcon(data.changes.net.amount)}
          </div>
          <p className={`text-xs mt-1 ${data.changes.net.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatChange(data.changes.net.amount, data.changes.net.percent)}
          </p>
        </div>
      </div>

      {/* Category Changes */}
      {data.categoryChanges.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">Biggest Category Changes</p>
          <div className="space-y-2">
            {data.categoryChanges.slice(0, 5).map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                <span className="text-sm capitalize">{cat.category}</span>
                <div className="text-right">
                  <p className={`text-sm font-medium ${cat.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cat.change > 0 ? '+' : ''}{formatCurrency(cat.change)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(cat.thisYear)} vs {formatCurrency(cat.lastYear)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
