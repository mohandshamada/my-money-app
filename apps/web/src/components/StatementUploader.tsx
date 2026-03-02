import { useState, useRef, useCallback } from 'react'
import { Upload, Sparkles, FileText, Loader2, Crown, AlertCircle, Check, Zap } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

interface StatementUploaderProps {
  onTransactionsExtracted: (transactions: any[]) => void
  userTier?: 'free' | 'standard' | 'premium'
}

export function StatementUploader({ onTransactionsExtracted, userTier = 'free' }: StatementUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'ai'>('standard')
  const [extractedData, setExtractedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPremium = userTier === 'premium'

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      icon: FileText,
      features: ['CSV & Excel files', 'Basic parsing', 'Up to 100 transactions/month'],
      allowedFormats: ['.csv', '.xlsx', '.xls', '.txt'],
      color: 'gray'
    },
    {
      id: 'standard',
      name: 'Standard',
      icon: Zap,
      features: ['PDF support', 'CSV & Excel files', 'Up to 1,000 transactions/month', 'Standard parsing'],
      allowedFormats: ['.csv', '.xlsx', '.xls', '.txt', '.pdf'],
      color: 'blue',
      price: '$5/month'
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Sparkles,
      features: ['AI-powered parsing', 'All file formats', 'Up to 10,000 transactions/month', 'Smart categorization', 'Unusual detection'],
      allowedFormats: ['.csv', '.xlsx', '.xls', '.txt', '.pdf', '.png', '.jpg', '.jpeg'],
      color: 'purple',
      price: '$15/month'
    }
  ]

  const currentTier = tiers.find(t => t.id === userTier) || tiers[0]

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return
    
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    
    // Check if format is allowed for user's tier
    if (!currentTier.allowedFormats.includes(fileExt)) {
      const requiredTier = fileExt === '.pdf' ? 'standard' : 'premium'
      setError(`⭐ ${fileExt.toUpperCase()} files require ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} subscription`)
      return
    }
    
    setUploading(true)
    setError(null)
    
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf')
      const isImage = /\.(png|jpe?g)$/i.test(file.name)
      // For AI mode with PDFs/images, send as base64
      const asDataUrl = selectedMethod === 'ai' && isPremium && (isPdf || isImage)
      const content = await readFileContent(file, asDataUrl)
      const token = localStorage.getItem('token')
      
      if (selectedMethod === 'ai' && isPremium) {
        // AI-powered parsing (PREMIUM)
        const response = await axios.post(`${API_URL}/api/statements/ai/analyze-ai`, {
          fileContent: content,
          fileName: file.name,
          bankType: detectBankType(file.name)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setExtractedData(response.data)
        onTransactionsExtracted(response.data.transactions || [])
      } else {
        // Standard parsing (FREE or STANDARD)
        const response = await axios.post(`${API_URL}/api/statements/ai/parse-standard`, {
          fileContent: content,
          fileName: file.name,
          fileType: file.type
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setExtractedData(response.data)
        onTransactionsExtracted(response.data.transactions || [])
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      if (err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setError(`⭐ ${err.response.data.error}`)
      } else {
        setError(err.response?.data?.error || 'Failed to parse statement')
      }
    } finally {
      setUploading(false)
    }
  }, [selectedMethod, isPremium, currentTier, onTransactionsExtracted])

  const readFileContent = (file: File, asDataUrl = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      // For PDFs in AI mode, read as base64
      if (asDataUrl) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const detectBankType = (fileName: string): string => {
    const name = fileName.toLowerCase()
    if (name.includes('hsbc')) return 'hsbc'
    if (name.includes('chase')) return 'chase'
    if (name.includes('bofa')) return 'bofa'
    return 'generic'
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  return (
    <div className="space-y-4">
      {/* Current Tier Badge */}
      <div className={`p-3 rounded-lg border-2 ${
        userTier === 'premium' ? 'border-purple-500 bg-purple-50' :
        userTier === 'standard' ? 'border-blue-500 bg-blue-50' :
        'border-gray-300 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <currentTier.icon className={`h-5 w-5 ${
              userTier === 'premium' ? 'text-purple-600' :
              userTier === 'standard' ? 'text-blue-600' :
              'text-gray-600'
            }`} />
            <span className="font-medium">{currentTier.name} Plan</span>
          </div>
          {userTier !== 'premium' && (
            <a href="/settings/subscription" className="text-sm text-blue-600 hover:underline">
              Upgrade
            </a>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Supported: {currentTier.allowedFormats.join(', ')}
        </p>
      </div>

      {/* Method Selection (Premium only sees AI option) */}
      {isPremium && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedMethod('standard')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMethod === 'standard'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Standard</p>
                <p className="text-xs text-gray-500">Regular parsing</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('ai')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMethod === 'ai'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium flex items-center gap-1">
                  AI Powered
                  <Crown className="h-3 w-3 text-yellow-500" />
                </p>
                <p className="text-xs text-gray-500">Smart extraction</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* AI Features Badge */}
      {selectedMethod === 'ai' && isPremium && (
        <div className="p-3 bg-purple-50 rounded-lg text-sm">
          <p className="font-medium text-purple-800 mb-1">✨ AI Features Active:</p>
          <ul className="text-purple-700 space-y-1 text-xs">
            <li>• Smart merchant detection</li>
            <li>• Auto-categorization</li>
            <li>• Unusual transaction alerts</li>
            <li>• Handles any format</li>
          </ul>
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={currentTier.allowedFormats.join(',')}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-600">
              {selectedMethod === 'ai' ? '🤖 AI is analyzing...' : '📄 Parsing...'}
            </p>
          </div>
        ) : (
          <>
            <div className={`p-4 rounded-full mx-auto mb-3 w-fit ${
              selectedMethod === 'ai' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              {selectedMethod === 'ai' ? (
                <Sparkles className="h-6 w-6 text-purple-600" />
              ) : (
                <Upload className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <p className="font-medium mb-1">Click or drag to upload</p>
            <p className="text-sm text-gray-500">
              {currentTier.allowedFormats.join(', ')}
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {extractedData && (
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="font-medium text-green-800">
              {extractedData.totalFound || extractedData.transactions?.length || 0} transactions found
            </p>
            {extractedData.method === 'ai' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">AI</span>
            )}
          </div>
          
          {extractedData.aiInsights && (
            <p className="text-sm text-green-700 mb-2">{extractedData.aiInsights}</p>
          )}
          
          {extractedData.unusualItems?.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded">
              <p className="text-xs font-medium text-yellow-800">⚠️ Unusual items:</p>
              <ul className="text-xs text-yellow-700 mt-1">
                {extractedData.unusualItems.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
