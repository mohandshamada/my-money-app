import { useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Camera, Loader2, X, Search, MessageSquare, Sparkles } from 'lucide-react'
import axios from 'axios'
import { RootState } from '../store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
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

// Natural Language Query Component
function NaturalLanguageQuery() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const transactions = useSelector((state: RootState) => state.transactions.transactions)

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/ai/query`, {
        query,
        transactions: transactions.slice(0, 50) // Send recent transactions
      })
      setResult(response.data)
    } catch (error) {
      console.error('Query failed:', error)
      setResult({ answer: 'Failed to process query. Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [query, transactions])

  const suggestions = [
    'How much did I spend on food this month?',
    'What\'s my biggest expense category?',
    'Show me all Uber transactions',
    'How much have I saved?'
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Ask Your Finances</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          placeholder="Ask anything about your money..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleQuery}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => { setQuery(s); handleQuery() }}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="font-medium text-blue-900">{result.answer}</p>
          {result.related_transactions?.length > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              Found {result.related_transactions.length} related transactions
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Spending Insights Component
function SpendingInsights() {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const transactions = useSelector((state: RootState) => state.transactions.transactions)

  const generateInsights = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/ai/insights`, {
        transactions,
        timeframe: 'last 30 days'
      })
      setInsights(response.data)
    } catch (error) {
      console.error('Insights failed:', error)
    } finally {
      setLoading(false)
    }
  }, [transactions])

  if (!insights && !loading) {
    return (
      <button
        onClick={generateInsights}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-colors"
      >
        <Sparkles className="h-5 w-5" />
        <span>Generate AI Insights</span>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-gray-600">Analyzing your spending patterns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold">AI Insights</h3>
        </div>
        <button
          onClick={generateInsights}
          className="text-sm text-purple-600 hover:underline"
        >
          Refresh
        </button>
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
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
          {activeTab === 'query' && <NaturalLanguageQuery />}
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
      className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  )
}