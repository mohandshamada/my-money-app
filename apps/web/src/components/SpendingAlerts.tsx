import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Info, X, Bell } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Alert {
  type: 'overspending' | 'over_budget' | 'bill_increase'
  severity: 'high' | 'medium' | 'low'
  category: string
  message: string
  recommendation: string
  percentUsed?: number
  budget?: number
  spent?: number
  daysRemaining?: number
}

export function SpendingAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_URL}/api/alerts/spending-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAlerts(res.data.alerts || [])
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (index: number) => {
    setDismissed([...dismissed, `${index}`])
  }

  const visibleAlerts = alerts.filter((_, i) => !dismissed.includes(`${i}`))

  if (loading || visibleAlerts.length === 0) return null

  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getIconColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">Spending Alerts</h3>
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
            {visibleAlerts.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {expanded ? '−' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {visibleAlerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${getAlertStyle(alert.severity)} relative`}
            >
              <button
                onClick={() => dismissAlert(i)}
                className="absolute top-2 right-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                {alert.type === 'over_budget' ? (
                  <AlertTriangle className={`h-5 w-5 ${getIconColor(alert.severity)} flex-shrink-0 mt-0.5`} />
                ) : alert.type === 'bill_increase' ? (
                  <TrendingUp className={`h-5 w-5 ${getIconColor(alert.severity)} flex-shrink-0 mt-0.5`} />
                ) : (
                  <Info className={`h-5 w-5 ${getIconColor(alert.severity)} flex-shrink-0 mt-0.5`} />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.message}</p>
                  {alert.recommendation && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      💡 {alert.recommendation}
                    </p>
                  )}
                  {alert.percentUsed && alert.budget && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>${alert.spent?.toFixed(0)} spent</span>
                        <span>${alert.budget} budget</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            alert.percentUsed > 100 ? 'bg-red-500' :
                            alert.percentUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(alert.percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
