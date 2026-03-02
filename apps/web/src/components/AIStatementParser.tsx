import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2, Building2, Edit2, Save, Trash2, Wand2 } from 'lucide-react'

export interface ParsedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  balance?: number
  confidence: number // AI confidence score
  category?: string
  merchant?: string
}

export interface AIStatementResult {
  fileName: string
  bankName: string
  accountNumber?: string
  currency: string
  originalCurrency?: string
  targetCurrency?: string
  currencyConverted?: boolean
  exchangeRate?: number
  statementPeriod: { from: string; to: string }
  transactions: ParsedTransaction[]
  totalCredits: number
  totalDebits: number
  parsingMethod: 'ai' | 'csv' | 'error' | 'pdfplumber'
  error?: string
}

interface AIStatementParserProps {
  onImport: (results: AIStatementResult[]) => void
  onClose: () => void
}

export function AIStatementParser({ onImport, onClose }: AIStatementParserProps) {
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [results, setResults] = useState<AIStatementResult[]>([])
  const [editingTx, setEditingTx] = useState<{ resultIndex: number; txIndex: number } | null>(null)
  const [targetCurrency, setTargetCurrency] = useState<string>('')
  const [convertCurrency, setConvertCurrency] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Read file content as text
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string || '')
      reader.onerror = reject
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  // Use AI to parse statement content
  const parseWithAI = async (file: File, content: string): Promise<AIStatementResult> => {
    try {
      const token = localStorage.getItem('token')
      const isPDF = file.type === 'application/pdf'
      
      if (isPDF) {
        // Use AI PDF parser for better extraction
        const formData = new FormData()
        formData.append('file', file)
        
        const parseResponse = await fetch('/api/statements/parse-pdf-ai', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
        
        if (!parseResponse.ok) {
          const errorData = await parseResponse.json().catch(() => ({ error: 'PDF parsing failed' }))
          
          // Handle AI service unavailable with friendly fallback
          if (parseResponse.status === 503 && errorData.error === 'AI_SERVICE_UNAVAILABLE') {
            const useLocal = window.confirm(
              `⚠️ AI Service Unavailable\n\n` +
              `${errorData.message}\n\n` +
              `${errorData.suggestion}\n\n` +
              `Click OK to use Local Parsing (faster but may be less accurate for complex layouts)\n` +
              `Click Cancel to try again later.`
            )
            
            if (useLocal) {
              // Fall back to local parsing
              throw new Error('FALLBACK_TO_LOCAL')
            } else {
              throw new Error(errorData.message || 'AI service unavailable')
            }
          }
          
          throw new Error(errorData.error || errorData.details || `PDF parsing failed (${parseResponse.status})`)
        }
        
        const parseData = await parseResponse.json()
        
        // If we have structured data from AI
        if (parseData.transactions) {
          const transactions: ParsedTransaction[] = parseData.transactions.map((tx: any, idx: number) => ({
            id: tx.id || `ai-${Date.now()}-${idx}`,
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            balance: undefined,
            confidence: tx.confidence || 0.95,
            category: tx.category,
            merchant: tx.merchant
          }))

          return {
            fileName: file.name,
            bankName: parseData.bankName || 'Unknown Bank',
            accountNumber: undefined,
            currency: parseData.currency || 'AUD',
            originalCurrency: parseData.currency || 'AUD',
            targetCurrency: convertCurrency ? targetCurrency : undefined,
            currencyConverted: false,
            statementPeriod: parseData.statementPeriod || { from: '', to: '' },
            parsingMethod: parseData.extractionMethod || 'ai',
            transactions,
            totalCredits: transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
            totalDebits: transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
          }
        }
        
        // Fallback to text-based extraction
        if (!token) throw new Error('Authentication token not found')
        return parseWithTextExtraction(file, parseData.text || '', token)
      }
      
      // For CSV, use the content directly
      if (file.name.endsWith('.csv')) {
        try {
          return parseCSVFallback(file, content)
        } catch {}
      }
      
      // Fallback to text-based extraction
      if (!token) throw new Error('Authentication token not found')
      return parseWithTextExtraction(file, content, token)
      
    } catch (error: any) {
      console.error('Parse error:', error)
      // Fallback to CSV parsing for CSV files
      if (file.name.endsWith('.csv')) {
        try {
          return parseCSVFallback(file, content)
        } catch {}
      }
      
      return {
        fileName: file.name,
        bankName: 'Unknown',
        currency: 'USD',
        statementPeriod: { from: '', to: '' },
        transactions: [],
        totalCredits: 0,
        totalDebits: 0,
        parsingMethod: 'error',
        error: error.message || 'Failed to parse statement'
      }
    }
  }

  // Text-based extraction (fallback)
  const parseWithTextExtraction = async (file: File, text: string, token: string): Promise<AIStatementResult> => {
    // Use backend AI extraction
    const extractResponse = await fetch('/api/statements/extract-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text,
        bankName: detectBankFromContent(text),
        targetCurrency: convertCurrency ? targetCurrency : undefined,
        convertCurrency
      })
    })
    
    if (!extractResponse.ok) {
      const errorData = await extractResponse.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || errorData.details || `AI extraction failed (${extractResponse.status})`)
    }
    
    const data = await extractResponse.json()
    
    const transactions: ParsedTransaction[] = (data.transactions || []).map((tx: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      balance: tx.balance,
      confidence: 0.9,
      category: tx.category,
      merchant: tx.merchant
    }))

    return {
      fileName: file.name,
      bankName: data.bankName || 'Unknown Bank',
      accountNumber: data.accountNumber,
      currency: data.targetCurrency || data.currency || 'USD',
      originalCurrency: data.originalCurrency,
      targetCurrency: data.targetCurrency,
      currencyConverted: data.currencyConverted,
      exchangeRate: data.exchangeRate,
      statementPeriod: data.statementPeriod || { from: '', to: '' },
      parsingMethod: data.extractionMethod === 'local' ? 'csv' : 'ai',
      transactions,
      totalCredits: data.totalCredits || 0,
      totalDebits: data.totalDebits || 0
    }
  }

  // CSV fallback parser
  const parseCSVFallback = (file: File, content: string): AIStatementResult => {
    const lines = content.split('\n').filter(l => l.trim())
    const transactions: ParsedTransaction[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      if (cols.length < 3) continue

      const amount = parseFloat(cols.find(c => c.match(/^-?[\d,]+\.?\d*$/))?.replace(/,/g, '') || '0')
      const date = cols.find(c => c.match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/))
      const desc = cols.find(c => c.length > 5 && isNaN(parseFloat(c))) || cols[1]

      if (amount && date) {
        transactions.push({
          id: `csv-${Date.now()}-${i}`,
          date: normalizeDate(date),
          description: desc || 'Transaction',
          amount: Math.abs(amount),
          type: amount < 0 ? 'credit' : 'debit',
          confidence: 0.7
        })
      }
    }

    const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
    const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

    return {
      fileName: file.name,
      bankName: detectBankFromContent(content) || 'Unknown Bank',
      currency: 'USD',
      statementPeriod: {
        from: transactions[0]?.date || '',
        to: transactions[transactions.length - 1]?.date || ''
      },
      transactions,
      totalCredits,
      totalDebits,
      parsingMethod: 'csv'
    }
  }

  const handleParse = async () => {
    setParsing(true)
    const parseResults: AIStatementResult[] = []

    for (const file of files) {
      try {
        const content = await readFileContent(file)
        const result = await parseWithAI(file, content)
        parseResults.push(result)
      } catch (error: any) {
        parseResults.push({
          fileName: file.name,
          bankName: 'Error',
          currency: 'USD',
          statementPeriod: { from: '', to: '' },
          transactions: [],
          totalCredits: 0,
          totalDebits: 0,
          parsingMethod: 'error',
          error: error.message
        })
      }
    }

    setResults(parseResults)
    setParsing(false)
  }

  const updateTransaction = (resultIndex: number, txIndex: number, updates: Partial<ParsedTransaction>) => {
    setResults(prev => {
      const newResults = [...prev]
      const tx = { ...newResults[resultIndex].transactions[txIndex], ...updates }
      newResults[resultIndex].transactions[txIndex] = tx
      
      // Recalculate totals
      newResults[resultIndex].totalCredits = newResults[resultIndex].transactions
        .filter(t => t.type === 'credit')
        .reduce((s, t) => s + t.amount, 0)
      newResults[resultIndex].totalDebits = newResults[resultIndex].transactions
        .filter(t => t.type === 'debit')
        .reduce((s, t) => s + t.amount, 0)
      
      return newResults
    })
    setEditingTx(null)
  }

  const deleteTransaction = (resultIndex: number, txIndex: number) => {
    setResults(prev => {
      const newResults = [...prev]
      newResults[resultIndex].transactions.splice(txIndex, 1)
      
      newResults[resultIndex].totalCredits = newResults[resultIndex].transactions
        .filter(t => t.type === 'credit')
        .reduce((s, t) => s + t.amount, 0)
      newResults[resultIndex].totalDebits = newResults[resultIndex].transactions
        .filter(t => t.type === 'debit')
        .reduce((s, t) => s + t.amount, 0)
      
      return newResults
    })
  }

  const handleImport = () => {
    const validResults = results.filter(r => r.transactions.length > 0)
    if (validResults.length > 0) {
      onImport(validResults)
    }
  }

  const totalTransactions = results.reduce((sum, r) => sum + r.transactions.length, 0)
  const allParsed = results.length > 0 && !parsing

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-purple-500" />
              AI Statement Parser
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload statements. AI will extract transactions automatically.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Upload Area */}
          {results.length === 0 && (
            <>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="font-medium">Click or drag files to upload</p>
                <p className="text-sm text-gray-500 mt-1">Supports CSV, PDF, Images</p>
                <input ref={fileInputRef} type="file" accept=".csv,.pdf,.png,.jpg,.jpeg" multiple onChange={handleFileSelect} className="hidden" />
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-sm text-gray-600">Files ({files.length})</h3>
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 hover:bg-red-100 text-red-500 rounded">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Currency Conversion Option */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={convertCurrency}
                        onChange={(e) => setConvertCurrency(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-sm">Convert to different currency</span>
                    </label>
                    
                    {convertCurrency && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm text-gray-600">Target currency:</span>
                        <select
                          value={targetCurrency}
                          onChange={(e) => setTargetCurrency(e.target.value)}
                          className="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="">Select currency...</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EGP">EGP - Egyptian Pound</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="SAR">SAR - Saudi Riyal</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-6">
              {results.map((result, rIdx) => (
                <div key={rIdx} className={`border rounded-xl overflow-hidden ${
                  result.error ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {/* Result Header */}
                  <div className={`p-4 ${result.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className={`h-5 w-5 ${result.error ? 'text-red-500' : 'text-gray-500'}`} />
                        <div>
                          <p className="font-medium">{result.bankName}</p>
                          <p className="text-sm text-gray-500">{result.fileName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {result.error ? (
                          <span className="text-red-600 text-sm">Failed</span>
                        ) : (
                          <>
                            <p className="text-sm">{result.transactions.length} transactions</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              result.parsingMethod === 'ai' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {result.parsingMethod === 'ai' ? 'AI Parsed' : 'CSV Parsed'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>                    
                    {result.error && (
                      <p className="text-sm text-red-600 mt-2">{result.error}</p>
                    )}
                    
                    {!result.error && (
                      <div className="flex gap-4 mt-2 text-sm flex-wrap">
                        {result.currencyConverted ? (
                          <>
                            <span className="text-green-600">
                              +{result.targetCurrency} {Number(result.totalCredits || 0).toFixed(2)} credits
                              <span className="text-xs text-gray-500 ml-1">(converted from {result.originalCurrency})</span>
                            </span>
                            <span className="text-red-600">
                              -{result.targetCurrency} {Number(result.totalDebits || 0).toFixed(2)} debits
                            </span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              Rate: 1 {result.originalCurrency} = {result.exchangeRate?.toFixed(4)} {result.targetCurrency}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-600">+{result.currency} {Number(result.totalCredits || 0).toFixed(2)} credits</span>
                            <span className="text-red-600">-{result.currency} {Number(result.totalDebits || 0).toFixed(2)} debits</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Transactions Table */}
                  {!result.error && result.transactions.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/30">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                            <th className="px-4 py-2 text-center">Type</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.transactions.map((tx, tIdx) => (
                            <tr key={tx.id} className="border-t dark:border-gray-700">
                              {editingTx?.resultIndex === rIdx && editingTx?.txIndex === tIdx ? (
                                <EditRow 
                                  tx={tx} 
                                  onSave={(updates) => updateTransaction(rIdx, tIdx, updates)}
                                  onCancel={() => setEditingTx(null)}
                                />
                              ) : (
                                <>
                                  <td className="px-4 py-2">{tx.date}</td>
                                  <td className="px-4 py-2">
                                    {tx.merchant && <span className="font-medium">{tx.merchant}</span>}
                                    <div className="text-xs text-gray-500">{tx.description}</div>
                                  </td>
                                  <td className="px-4 py-2">
                                    {tx.category && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        {tx.category}
                                      </span>
                                    )}
                                  </td>
                                  <td className={`px-4 py-2 text-right font-medium ${
                                    tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {tx.type === 'credit' ? '+' : '-'}{Number(tx.amount || 0).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      tx.type === 'credit' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center gap-1">
                                      <button 
                                        onClick={() => setEditingTx({ resultIndex: rIdx, txIndex: tIdx })}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => deleteTransaction(rIdx, tIdx)}
                                        className="p-1 hover:bg-red-100 text-red-500 rounded"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500">
            {allParsed && totalTransactions > 0 && (
              <span>{totalTransactions} transactions ready to import</span>
            )}
          </div>
          <div className="flex gap-3">
            {allParsed ? (
              <>
                <button
                  onClick={() => { setResults([]); setFiles([]); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Parse More
                </button>
                <button
                  onClick={handleImport}
                  disabled={totalTransactions === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Import {totalTransactions > 0 && `(${totalTransactions})`} Transactions
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleParse}
                  disabled={files.length === 0 || parsing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI Parsing...
                    </>
                  ) : (
                    <>Parse with AI</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Edit row component
function EditRow({ tx, onSave, onCancel }: { 
  tx: ParsedTransaction
  onSave: (updates: Partial<ParsedTransaction>) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(tx.date)
  const [description, setDescription] = useState(tx.description)
  const [amount, setAmount] = useState(tx.amount.toString())
  const [type, setType] = useState(tx.type)
  const [category, setCategory] = useState(tx.category || 'Other')

  const categories = ['Food', 'Entertainment', 'Transport', 'Shopping', 'Health', 'Bills', 'Transfer', 'Other']

  return (
    <>
      <td className="px-2 py-2">
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
        />
      </td>
      <td className="px-2 py-2">
        <input 
          type="text" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
        />
      </td>
      <td className="px-2 py-2">
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <input 
          type="number" 
          step="0.01"
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 text-right"
        />
      </td>
      <td className="px-2 py-2 text-center">
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value as 'debit' | 'credit')}
          className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
      </td>
      <td className="px-2 py-2 text-center">
        <div className="flex justify-center gap-1">
          <button 
            onClick={() => onSave({ date, description, amount: parseFloat(amount), type, category })}
            className="p-1 hover:bg-green-100 text-green-600 rounded"
          >
            <Save className="h-4 w-4" />
          </button>
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </>
  )
}

// Helper functions
function detectBankFromContent(content: string): string | null {
  const lower = content.toLowerCase()
  if (lower.includes('hsbc')) return 'HSBC'
  if (lower.includes('chase')) return 'Chase Bank'
  if (lower.includes('citi')) return 'Citibank'
  if (lower.includes('nbe') || lower.includes('national bank of egypt')) return 'National Bank of Egypt'
  if (lower.includes('cib')) return 'Commercial International Bank'
  if (lower.includes('fab') || lower.includes('first abu dhabi')) return 'First Abu Dhabi Bank'
  if (lower.includes('emirates nbd')) return 'Emirates NBD'
  if (lower.includes('adcb')) return 'Abu Dhabi Commercial Bank'
  return null
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  
  // Try DD/MM/YYYY
  let match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }
  
  // Try native parsing
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  
  return new Date().toISOString().split('T')[0]
}

export default AIStatementParser
