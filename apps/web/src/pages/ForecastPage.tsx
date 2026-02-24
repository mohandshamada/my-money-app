import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { ForecastChart } from '../components/Charts'
import axios from 'axios'
import { useCurrency } from '../contexts/CurrencyContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface ForecastData {
  forecast: Array<{
    date: string
    projectedBalance: number
    confidenceLow68: number
    confidenceHigh68: number
    confidenceLow95: number
    confidenceHigh95: number
  }>
  summary: {
    currentBalance: number
    projectedBalance30d: number
    projectedBalance365d?: number
  }
}

export function ForecastPage() {
  const { formatAmount } = useCurrency()
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchForecast()
  }, [days])

  const fetchForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/forecast?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setForecastData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load forecast')
    } finally {
      setLoading(false)
    }
  }

  const periodButtons = [
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
    { label: '5 Years', value: 1825 }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cash Flow Forecast</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projection</h2>
            <div className="flex gap-2">
              {periodButtons.map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setDays(btn.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    days === btn.value
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <ForecastChart data={forecastData?.forecast || []} />
          )}
          
          {/* Confidence Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              <span>Projected Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-blue-300"></div>
              <span>68% Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-blue-200"></div>
              <span>95% Confidence</span>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Summary</h3>
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(forecastData?.summary.currentBalance || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Projected ({days} days)
                  </p>
                  <p className={`text-2xl font-bold ${
                    (forecastData?.summary.projectedBalance30d || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatAmount(forecastData?.summary.projectedBalance30d || 0)}
                  </p>
                </div>
                <div className="pt-2 border-t dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Change</p>
                  <p className={`text-lg font-semibold ${
                    ((forecastData?.summary.projectedBalance30d || 0) - (forecastData?.summary.currentBalance || 0)) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {((forecastData?.summary.projectedBalance30d || 0) - (forecastData?.summary.currentBalance || 0)) >= 0 ? '+' : ''}
                    {formatAmount((forecastData?.summary.projectedBalance30d || 0) - (forecastData?.summary.currentBalance || 0))}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* What-If Scenarios */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              What-If Scenarios
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Test different spending scenarios to see how they affect your future balance.
            </p>
            <button className="w-full btn-secondary">
              Create Scenario
            </button>
          </div>

          {/* Info */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">How It Works</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Our forecast uses Monte Carlo simulation with your historical spending patterns to predict future balances with confidence intervals.
            </p>
          </div>
        </div>
      </div>

      {/* Calendar View Placeholder */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar View
        </h2>
        <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500">Calendar view coming soon...</p>
        </div>
      </div>
    </div>
  )
}
