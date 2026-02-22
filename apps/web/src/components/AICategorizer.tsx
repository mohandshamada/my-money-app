import { useState, useCallback } from 'react'
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface AICategorizerProps {
  merchant?: string
  description?: string
  amount: number
  onCategorySelect: (category: string, confidence: number) => void
}

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', keywords: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'taco', 'food', 'meal', 'delivery', 'grubhub', 'doordash', 'uber eats'] },
  { id: 'groceries', name: 'Groceries', keywords: ['grocery', 'supermarket', 'walmart', 'target', 'kroger', 'whole foods', 'trader joe', 'safeway', 'aldi'] },
  { id: 'transport', name: 'Transportation', keywords: ['uber', 'lyft', 'taxi', 'gas', 'shell', 'exxon', 'bp', 'chevron', 'transit', 'bus', 'train', 'parking', 'toll'] },
  { id: 'shopping', name: 'Shopping', keywords: ['amazon', 'ebay', 'etsy', 'shopify', 'clothing', 'fashion', 'electronics', 'apple', 'best buy', 'costco'] },
  { id: 'entertainment', name: 'Entertainment', keywords: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'movie', 'cinema', 'theater', 'concert', 'game', 'steam'] },
  { id: 'bills', name: 'Bills & Utilities', keywords: ['electric', 'water', 'gas bill', 'internet', 'phone', 'insurance', 'rent', 'mortgage', 'hoa'] },
  { id: 'health', name: 'Health & Fitness', keywords: ['gym', 'fitness', 'pharmacy', 'doctor', 'dentist', 'hospital', 'medical', 'cvs', 'walgreens'] },
  { id: 'travel', name: 'Travel', keywords: ['airline', 'hotel', 'booking', 'expedia', 'airbnb', 'flight', 'vacation', 'trip'] },
  { id: 'education', name: 'Education', keywords: ['tuition', 'course', 'book', 'udemy', 'coursera', 'school', 'college', 'university'] },
  { id: 'income', name: 'Income', keywords: ['salary', 'paycheck', 'deposit', 'refund', 'dividend', 'interest'] },
]

// Simple rule-based categorization (fallback when AI unavailable)
function ruleBasedCategorize(merchant: string, description: string): { category: string; confidence: number } {
  const text = `${merchant} ${description}`.toLowerCase()
  
  for (const category of CATEGORIES) {
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return { category: category.id, confidence: 0.7 }
      }
    }
  }
  
  // Default based on common patterns
  if (text.includes('transfer')) return { category: 'other', confidence: 0.3 }
  if (text.includes('payment')) return { category: 'bills', confidence: 0.4 }
  
  return { category: 'other', confidence: 0.2 }
}

// AI-powered categorization using GLM-5
async function aiCategorize(merchant: string, description: string, amount: number): Promise<{ category: string; confidence: number; reasoning: string }> {
  try {
    const response = await axios.post(`${API_URL}/api/ai/categorize`, {
      merchant,
      description,
      amount,
      categories: CATEGORIES.map(c => ({ id: c.id, name: c.name }))
    })
    
    return response.data
  } catch (error) {
    // Fallback to rule-based
    const result = ruleBasedCategorize(merchant, description)
    return { 
      category: result.category, 
      confidence: result.confidence,
      reasoning: 'Rule-based fallback (AI service unavailable)'
    }
  }
}

export function AICategorizer({ merchant, description, amount, onCategorySelect }: AICategorizerProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<{ category: string; confidence: number; reasoning: string } | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleAutoCategorize = useCallback(async () => {
    if (!merchant && !description) return
    
    setLoading(true)
    try {
      const result = await aiCategorize(merchant || '', description || '', amount)
      setSuggestion(result)
      
      // Auto-select if confidence is high
      if (result.confidence >= 0.8) {
        onCategorySelect(result.category, result.confidence)
      }
    } catch (error) {
      console.error('AI categorization failed:', error)
    } finally {
      setLoading(false)
    }
  }, [merchant, description, amount, onCategorySelect])

  const getCategoryName = (id: string) => {
    return CATEGORIES.find(c => c.id === id)?.name || id
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.5) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.5) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-3">
      {/* AI Suggest Button */}
      {!suggestion && (
        <button
          onClick={handleAutoCategorize}
          disabled={loading || (!merchant && !description)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Categorize
            </>
          )}
        </button>
      )}

      {/* Suggestion Result */}
      {suggestion && (
        <div className={`p-4 rounded-lg border-2 ${
          suggestion.confidence >= 0.8 
            ? 'bg-green-50 border-green-200' 
            : suggestion.confidence >= 0.5 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className={`h-5 w-5 ${
                suggestion.confidence >= 0.8 ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <div>
                <p className="font-medium">
                  Suggested: {getCategoryName(suggestion.category)}
                </p>
                <p className={`text-sm ${getConfidenceColor(suggestion.confidence)}`}>
                  Confidence: {getConfidenceLabel(suggestion.confidence)} ({(suggestion.confidence * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCategorySelect(suggestion.category, suggestion.confidence)}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </button>
              <button
                onClick={() => setSuggestion(null)}
                className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>

          {/* Show AI reasoning */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showDetails ? 'Hide' : 'Show'} AI reasoning
          </button>
          
          {showDetails && (
            <p className="mt-2 text-sm text-gray-600 italic">
              "{suggestion.reasoning}"
            </p>
          )}
        </div>
      )}

      {/* Category Confidence Indicator */}
      {suggestion && suggestion.confidence < 0.5 && (
        <p className="text-sm text-orange-600">
          ⚠️ Low confidence. Please review and select manually.
        </p>
      )}
    </div>
  )
}

// Export the categorization function for use elsewhere
export { aiCategorize, ruleBasedCategorize, CATEGORIES }