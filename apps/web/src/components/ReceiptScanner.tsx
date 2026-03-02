import { useState, useRef, useCallback } from 'react'
import { Camera, Loader2, X, CheckCircle, Plus, Receipt } from 'lucide-react'
import axios from 'axios'
import { useCurrency } from '../contexts/CurrencyContext'

const API_URL = import.meta.env.VITE_API_URL || ''

interface ScannedReceipt {
  merchant: string
  amount: number
  date: string
  category: string
  items?: string[]
  confidence: number
}

interface ReceiptScannerProps {
  onAddTransaction?: (transaction: {
    merchant: string
    amount: number
    date: string
    category: string
    isExpense: boolean
  }) => void
  variant?: 'compact' | 'full'
}

export function ReceiptScanner({ onAddTransaction, variant = 'full' }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ScannedReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { formatAmount } = useCurrency()

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Max 10MB.')
      return
    }

    setError(null)
    setResult(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Scan with AI
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/api/ai/scan-receipt`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : undefined
        }
      })

      if (response.data) {
        setResult({
          merchant: response.data.merchant || 'Unknown',
          amount: parseFloat(response.data.amount) || 0,
          date: response.data.date || new Date().toISOString().split('T')[0],
          category: response.data.category || 'Other',
          items: response.data.items || [],
          confidence: response.data.confidence || 0.8
        })
      }
    } catch (err: any) {
      console.error('OCR failed:', err)
      setError(err.response?.data?.error || 'Failed to scan receipt. Please try again or enter manually.')
    } finally {
      setScanning(false)
    }
  }, [])

  const handleAddTransaction = () => {
    if (!result || !onAddTransaction) return

    onAddTransaction({
      merchant: result.merchant,
      amount: result.amount,
      date: result.date,
      category: result.category,
      isExpense: true
    })

    // Reset
    setPreview(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = () => {
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Compact variant for dashboard
  if (variant === 'compact') {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">Quick Receipt Scan</h3>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview && !result && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="h-5 w-5" />
            Scan a Receipt
          </button>
        )}

        {preview && !result && (
          <div className="relative">
            <img src={preview} alt="Receipt" className="w-full h-32 object-cover rounded-lg" />
            {scanning && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                  <p className="text-sm">Reading...</p>
                </div>
              </div>
            )}
            {!scanning && (
              <button
                onClick={handleReset}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Receipt scanned!</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Merchant:</span>
                <span className="font-medium">{result.merchant}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium text-red-600">{formatAmount(result.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium">{result.category}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {onAddTransaction && (
                <button
                  onClick={handleAddTransaction}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              )}
              <button
                onClick={handleReset}
                className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Receipt className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold">Receipt Scanner</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Snap a photo to auto-extract details</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview && !result && (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700 dark:text-gray-300">Tap to scan receipt</p>
              <p className="text-sm text-gray-500">Supports JPG, PNG up to 10MB</p>
            </div>
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>Powered by GLM-5 Vision AI</span>
          </div>
        </div>
      )}

      {preview && !result && (
        <div className="relative">
          <img src={preview} alt="Receipt preview" className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-800 rounded-lg" />
          
          {scanning && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
              <div className="text-white text-center px-4">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                <p className="font-medium">Analyzing receipt...</p>
                <p className="text-sm text-gray-300 mt-1">Extracting merchant, amount, date</p>
              </div>
            </div>
          )}
          
          {!scanning && (
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remove receipt"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Receipt scanned successfully!</span>
            {result.confidence >= 0.9 && <span className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">High confidence</span>}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
              <span className="text-gray-500">Merchant</span>
              <span className="font-semibold text-lg">{result.merchant}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-xl text-red-600">{formatAmount(result.amount)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{new Date(result.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Category</span>
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {result.category}
              </span>
            </div>

            {result.items && result.items.length > 0 && (
              <div className="pt-3 border-t dark:border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Items detected:</p>
                <ul className="text-sm space-y-1">
                  {result.items.slice(0, 5).map((item, i) => (
                    <li key={i} className="text-gray-700 dark:text-gray-300">• {item}</li>
                  ))}
                  {result.items.length > 5 && (
                    <li className="text-gray-500">+ {result.items.length - 5} more items...</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {onAddTransaction && (
              <button
                onClick={handleAddTransaction}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Transaction
              </button>
            )}
            <button
              onClick={handleReset}
              className="py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

export default ReceiptScanner
