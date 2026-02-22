import { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = '/api'

export function QuickAdd() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const parseInput = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    try {
      // Send to AI for parsing
      const response = await axios.post(`${API_URL}/ai/parse-transaction`, {
        input: input.trim()
      })
      
      setResult(response.data)
      
      // Auto-add if high confidence
      if (response.data.confidence >= 0.8) {
        await axios.post(`${API_URL}/transactions`, response.data.transaction)
        setResult({ ...response.data, added: true })
      }
    } catch (error) {
      console.error('Parse failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    "Spent $45 on gas at Shell",
    "Received $2000 salary from Acme Corp",
    "Paid $85 electric bill",
    "Coffee $6.50 at Starbucks",
    "Groceries $127 at Whole Foods"
  ]

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold">Quick Add</h3>
        <span className="text-xs text-gray-500">Natural language input</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && parseInput()}
          placeholder="e.g., 'Spent $45 on gas' or 'Got paid $2000'"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={parseInput}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add'}
        </button>
      </div>

      {/* Example suggestions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setInput(ex)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Result preview */}
      {result && (
        <div className={`mt-4 p-3 rounded-lg ${
          result.added ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {result.added ? (
            <p className="text-green-700">✅ Added: {result.transaction.description}</p>
          ) : (
            <div>
              <p className="font-medium">Preview:</p>
              <p className="text-sm text-gray-600">
                {result.isExpense ? '📉' : '📈'} {result.merchant} • ${result.amount} • {result.category}
              </p>
              <button
                onClick={async () => {
                  await axios.post(`${API_URL}/transactions`, result.transaction)
                  setResult({ ...result, added: true })
                }}
                className="mt-2 px-3 py-1 bg-primary-600 text-white text-sm rounded"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}