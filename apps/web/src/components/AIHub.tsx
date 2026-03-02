import { useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Camera, Loader2, X, MessageSquare, Sparkles } from 'lucide-react'
import axios from 'axios'
import { RootState } from '../store'
import { AIChat } from './AIChat'

const API_URL = import.meta.env.VITE_API_URL || ''

interface AIInsightsProps {
  onClose: () => void
}

// Receipt OCR Component
function ReceiptOCR({ onScan }: { onScan: (data: any) => void }) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Scan with AI
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const response = await axios.post(`${API_URL}/api/ai/scan-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      onScan(response.data)
    } catch (error) {
      console.error('OCR failed:', error)
      alert('Failed to scan receipt. Please enter manually.')
    } finally {
      setScanning(false)
    }
  }, [onScan])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold">Receipt Scanner</h3>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Receipt preview" className="w-full h-48 object-contain bg-gray-100 rounded-lg" />
          {scanning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Reading receipt...</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { setPreview(null); fileInputRef.current && (fileInputRef.current.value = '') }}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-600"
            aria-label="Remove receipt preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Camera className="h-8 w-8 text-gray-400" />
          <span className="text-sm text-gray-600">Click to scan receipt</span>
        </button>
      )}
    </div>
  )
}

// Spending Insights Component
function SpendingInsights() {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'all' | '30days' | '90days' | 'custom'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const transactions = useSelector((state: RootState) => state.transactions.transactions)

  const generateInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // Filter transactions based on timeframe
    let filteredTransactions = transactions
    const now = new Date()
    
    if (timeframe === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filteredTransactions = transactions.filter((t: any) => new Date(t.date) >= thirtyDaysAgo)
    } else if (timeframe === '90days') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      filteredTransactions = transactions.filter((t: any) => new Date(t.date) >= ninetyDaysAgo)
    } else if (timeframe === 'custom' && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include full end date
      filteredTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date)
        return date >= start && date <= end
      })
    }
    
    console.log('Generating insights...', { 
      totalTransactions: transactions?.length,
      filteredTransactions: filteredTransactions?.length,
      timeframe 
    })
    
    try {
      const token = localStorage.getItem('token')
      
      const timeframeLabel = timeframe === 'all' ? 'all time' : 
                            timeframe === '30days' ? 'last 30 days' :
                            timeframe === '90days' ? 'last 90 days' :
                            `${startDate} to ${endDate}`
      
      const response = await axios.post(`${API_URL}/api/ai/insights`, {
        transactions: filteredTransactions,
        timeframe: timeframeLabel
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      })
      
      console.log('Insights response:', response.data)
      setInsights(response.data)
    } catch (err: any) {
      console.error('Insights failed:', err)
      setError(err.response?.data?.error || err.message || 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }, [transactions, timeframe, startDate, endDate])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-gray-600">Analyzing your spending patterns...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="p-4 bg-red-50 rounded-lg mb-4">
          <p className="text-red-600">{error}</p>
        </div>
        <button
          onClick={generateInsights}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="space-y-4">
        {!showOptions ? (
          <button
            onClick={() => setShowOptions(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            aria-label="Generate AI insights"
          >
            <Sparkles className="h-5 w-5" />
            <span>Generate AI Insights</span>
          </button>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
            <h4 className="font-medium">Select Time Period</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTimeframe('all')}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  timeframe === 'all' 
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                📊 All Time
              </button>
              <button
                onClick={() => setTimeframe('30days')}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  timeframe === '30days' 
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                📅 Last 30 Days
              </button>
              <button
                onClick={() => setTimeframe('90days')}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  timeframe === '90days' 
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                📆 Last 90 Days
              </button>
              <button
                onClick={() => setTimeframe('custom')}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  timeframe === 'custom' 
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                📆 Custom Range
              </button>
            </div>

            {timeframe === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowOptions(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={generateInsights}
                disabled={timeframe === 'custom' && (!startDate || !endDate)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Generate
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold">AI Insights</h3>
          <span className="text-xs text-gray-500">({timeframe === 'all' ? 'All Time' : timeframe === '30days' ? 'Last 30 Days' : timeframe === '90days' ? 'Last 90 Days' : 'Custom'})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setInsights(null); setShowOptions(true); }}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Change Period
          </button>
          <button
            onClick={generateInsights}
            className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <p className="text-gray-800">{insights?.summary}</p>
      </div>

      {/* Anomalies */}
      {insights?.anomalies?.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">⚠️ Unusual Spending</h4>
          <ul className="space-y-1">
            {insights.anomalies.map((a: string, i: number) => (
              <li key={i} className="text-sm text-red-700">• {a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {insights?.recommendations?.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">💡 Savings Tips</h4>
          <ul className="space-y-1">
            {insights.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-sm text-green-700">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Main AI Hub Modal
export function AIHub({ onClose }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'query' | 'receipt'>('insights')
  const [, setScannedReceipt] = useState<any>(null)

  const tabs = [
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'query', label: 'Ask', icon: MessageSquare },
    { id: 'receipt', label: 'Scan Receipt', icon: Camera },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Finance Assistant</h2>
              <p className="text-sm text-gray-500">Powered by GLM-5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Close modal">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'insights' && <SpendingInsights />}
          {activeTab === 'query' && <AIChat />}
          {activeTab === 'receipt' && <ReceiptOCR onScan={setScannedReceipt} />}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t text-center text-sm text-gray-500">
          AI features analyze your data locally. No financial information is stored externally.
        </div>
      </div>
    </div>
  )
}

// Quick AI Button for Dashboard
export function AIFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 p-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  )
}