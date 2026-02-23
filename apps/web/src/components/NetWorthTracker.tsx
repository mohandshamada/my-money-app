import { useState, useEffect } from 'react'
import { DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || ''

export function NetWorthTracker() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNetWorth()
  }, [])

  const fetchNetWorth = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_URL}/api/alerts/net-worth`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch net worth:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const latestTrend = data.trend[data.trend.length - 1]
  const previousTrend = data.trend[data.trend.length - 2]
  const monthChange = latestTrend?.net - previousTrend?.net || 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Net Worth</h3>
        {monthChange !== 0 && (
          <span className={`flex items-center gap-1 text-sm ${
            monthChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {monthChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {formatCurrency(Math.abs(monthChange))} this month
          </span>
        )}
      </div>

      {/* Main Number */}
      <div className="text-center py-6">
        <p className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(data.netWorth)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Total Net Worth
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Bank Balance</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(data.bankBalance)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Cash Flow</span>
          </div>
          <p className={`text-lg font-semibold ${data.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.cashFlow)}
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      {data.trend.length > 1 && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">6-Month Trend</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${v/1000}k`}
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
