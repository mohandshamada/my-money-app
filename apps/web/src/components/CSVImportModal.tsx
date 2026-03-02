import { useState, useRef, useCallback } from 'react'
import { Upload, Check, X, AlertCircle } from 'lucide-react'
import { parse } from 'papaparse'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (transactions: any[]) => void
}

interface ParsedRow {
  date?: string
  amount?: string | number
  description?: string
  category?: string
  merchant?: string
  [key: string]: any
}

export function CSVImportModal({ isOpen, onClose, onImport }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'upload' | 'map' | 'confirm'>('upload')
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrors([])

    // Parse first 5 rows for preview
    parse(selectedFile, {
      preview: 5,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data as ParsedRow[])
        
        // Auto-detect columns
        const headers = results.meta.fields || []
        const autoMap: Record<string, string> = {}
        
        headers.forEach((header: string) => {
          const lower = header.toLowerCase()
          if (lower.includes('date')) autoMap.date = header
          if (lower.includes('amount') || lower.includes('price') || lower.includes('total')) autoMap.amount = header
          if (lower.includes('desc') || lower.includes('memo') || lower.includes('note')) autoMap.description = header
          if (lower.includes('category')) autoMap.category = header
          if (lower.includes('merchant') || lower.includes('payee') || lower.includes('name')) autoMap.merchant = header
        })
        
        setColumnMap(autoMap)
        setStep('map')
      },
      error: (err) => {
        setErrors([`Failed to parse CSV: ${err.message}`])
      }
    })
  }, [])

  const handleImport = useCallback(() => {
    if (!file) return

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions = (results.data as ParsedRow[])
          .filter(row => row[columnMap.amount]) // Skip empty rows
          .map(row => {
            const amount = parseFloat(String(row[columnMap.amount]).replace(/[$,]/g, ''))
            return {
              date: row[columnMap.date] || new Date().toISOString().split('T')[0],
              amount: Math.abs(amount),
              isExpense: amount < 0,
              description: row[columnMap.description] || '',
              category: row[columnMap.category] || 'Uncategorized',
              merchant: row[columnMap.merchant] || row[columnMap.description] || 'Unknown',
            }
          })
          .filter(t => !isNaN(t.amount) && t.amount > 0)

        onImport(transactions)
        reset()
        onClose()
      }
    })
  }, [file, columnMap, onImport, onClose])

  const reset = () => {
    setFile(null)
    setPreview([])
    setColumnMap({})
    setStep('upload')
    setErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold pr-2">Import Transactions from CSV</h2>
          <button onClick={handleClose} aria-label="Close modal" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {step === 'upload' && (
            <div className="text-center py-8">
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">CSV files only</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-6 text-left">
                <h3 className="font-medium mb-2">Expected Format</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your CSV should have columns for: Date, Amount (negative for expenses), Description, Category (optional)
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm font-mono">
                  Date,Description,Amount,Category
                  <br />
                  2024-01-15,Grocery Store,-45.67,Food
                  <br />
                  2024-01-15,Salary,5000.00,Income
                </div>
              </div>
            </div>
          )}

          {step === 'map' && (
            <div>
              <p className="mb-4">Map CSV columns to transaction fields:</p>
              
              <div className="space-y-3 mb-6">
                {[
                  { key: 'date', label: 'Date', required: true },
                  { key: 'amount', label: 'Amount', required: true },
                  { key: 'description', label: 'Description', required: false },
                  { key: 'category', label: 'Category', required: false },
                  { key: 'merchant', label: 'Merchant/Payee', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 font-medium text-sm sm:text-base">
                      {label}
                      {required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={columnMap[key] || ''}
                      onChange={(e) => setColumnMap({ ...columnMap, [key]: e.target.value })}
                      className="flex-1 px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="">-- Select Column --</option>
                      {preview.length > 0 && Object.keys(preview[0]).map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <h3 className="font-medium mb-2 text-sm sm:text-base">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr className="border-b dark:border-gray-600">
                      {preview.length > 0 && Object.keys(preview[0]).map(col => (
                        <th key={col} className="text-left py-2 px-2 font-medium truncate">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-2 px-2 truncate max-w-xs">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setStep('upload')} className="btn-secondary py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!columnMap.date || !columnMap.amount}
                  className="btn-primary flex-1 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">Ready to Import</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Found {file?.name} with {preview.length}+ transactions.
                <br />
                Click Import to add them to your account.
              </p>

              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-3 rounded-lg mb-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Errors</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setStep('map')} className="btn-secondary py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  Back
                </button>
                <button onClick={handleImport} className="btn-primary flex-1 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  Import Transactions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
