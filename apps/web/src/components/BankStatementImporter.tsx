import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Building2 } from 'lucide-react'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  balance?: number
  reference?: string
}

export interface ParsedStatement {
  bankName: string
  accountNumber: string
  accountType: string
  currency: string
  statementPeriod: { from: string; to: string }
  openingBalance: number
  closingBalance: number
  transactions: ParsedTransaction[]
}

interface BankStatementImporterProps {
  onImport: (statements: ParsedStatement[]) => void
  onClose: () => void
}

// Bank-specific parsers
const BANK_PARSERS: Record<string, {
  name: string
  detect: (content: string) => boolean
  parseCSV: (lines: string[]) => ParsedStatement
  parsePDF?: (text: string) => ParsedStatement
}> = {
  generic: {
    name: 'Generic CSV',
    detect: () => true,
    parseCSV: parseGenericCSV
  },
  hsbc: {
    name: 'HSBC',
    detect: (content) => content.toLowerCase().includes('hsbc') || content.includes('Hongkong Shanghai Banking'),
    parseCSV: parseHSBCCSV
  },
  chase: {
    name: 'Chase Bank',
    detect: (content) => content.toLowerCase().includes('chase') || content.includes('JPMorgan'),
    parseCSV: parseChaseCSV
  },
  citi: {
    name: 'Citibank',
    detect: (content) => content.toLowerCase().includes('citi') || content.includes('CITIBANK'),
    parseCSV: parseCitiCSV
  },
  nbe: {
    name: 'National Bank of Egypt (NBE)',
    detect: (content) => content.toLowerCase().includes('national bank of egypt') || content.includes('البنك الأهلي المصري'),
    parseCSV: parseNBECSV
  },
  cib: {
    name: 'Commercial International Bank (CIB)',
    detect: (content) => content.toLowerCase().includes('cib') || content.includes('commercial international bank'),
    parseCSV: parseCIBCSV
  },
  fab: {
    name: 'First Abu Dhabi Bank (FAB)',
    detect: (content) => content.toLowerCase().includes('first abu dhabi') || content.includes('FAB'),
    parseCSV: parseFABCSV
  },
  adcb: {
    name: 'Abu Dhabi Commercial Bank',
    detect: (content) => content.toLowerCase().includes('adcb') || content.includes('abu dhabi commercial'),
    parseCSV: parseADCBCSCV
  },
  emirates: {
    name: 'Emirates NBD',
    detect: (content) => content.toLowerCase().includes('emirates nbd') || content.includes('emiratesnbd'),
    parseCSV: parseEmiratesNBDCSCV
  }
}

export function BankStatementImporter({ onImport, onClose }: BankStatementImporterProps) {
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [results, setResults] = useState<Array<{ file: File; statement?: ParsedStatement; error?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => 
        f.name.endsWith('.csv') || f.name.endsWith('.pdf') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      )
      setFiles([...files, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const detectBank = (content: string): string => {
    for (const [key, parser] of Object.entries(BANK_PARSERS)) {
      if (key !== 'generic' && parser.detect(content)) {
        return key
      }
    }
    return 'generic'
  }

  const parseFile = async (file: File): Promise<ParsedStatement> => {
    const content = await file.text()
    const lines = content.split('\n').filter(line => line.trim())
    
    const bankKey = detectBank(content)
    const parser = BANK_PARSERS[bankKey]
    
    if (file.name.endsWith('.csv')) {
      return parser.parseCSV(lines)
    }
    
    // For PDF, we'd need a PDF parser library
    throw new Error('PDF parsing requires server-side processing. Please upload CSV files for now.')
  }

  const handleParse = async () => {
    setParsing(true)
    const parseResults = []

    for (const file of files) {
      try {
        const statement = await parseFile(file)
        parseResults.push({ file, statement })
      } catch (error: any) {
        parseResults.push({ file, error: error.message })
      }
    }

    setResults(parseResults)
    setParsing(false)
  }

  const handleImport = () => {
    const successful = results
      .filter(r => r.statement)
      .map(r => r.statement!)
    
    if (successful.length > 0) {
      onImport(successful)
    }
  }

  const allSuccessful = results.length > 0 && results.every(r => r.statement)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Import Bank Statements
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload statements from multiple banks. Supports CSV format.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* File Upload Area */}
          {results.length === 0 && (
            <>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  CSV files from any bank
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.xlsx,.xls"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                    Selected Files ({files.length})
                  </h3>
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-red-100 text-red-500 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Supported Banks */}
              <div className="mt-6">
                <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Supported Banks (Auto-detected)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(BANK_PARSERS).map((parser, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                      {parser.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Parsing Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Parsing Results</h3>
              {results.map((result, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${
                  result.error 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200' 
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.error ? (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{result.file.name}</p>
                      {result.error ? (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{result.error}</p>
                      ) : (
                        <div className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                          <p>Bank: {result.statement?.bankName}</p>
                          <p>Account: {result.statement?.accountNumber}</p>
                          <p>Transactions: {result.statement?.transactions.length}</p>
                          <p>Period: {result.statement?.statementPeriod.from} to {result.statement?.statementPeriod.to}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
          {results.length > 0 ? (
            <>
              <button
                onClick={() => { setResults([]); setFiles([]); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Upload More
              </button>
              <button
                onClick={handleImport}
                disabled={!allSuccessful}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Import {allSuccessful ? results.length : 0} Statement{results.length !== 1 ? 's' : ''}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={files.length === 0 || parsing}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {parsing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>Parse {files.length > 0 && `(${files.length})`} File{files.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Parser implementations
function parseGenericCSV(lines: string[]): ParsedStatement {
  // Try to detect headers and data
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const dateIdx = headers.findIndex(h => h.includes('date'))
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('narrative') || h.includes('details'))
  const amountIdx = headers.findIndex(h => h.includes('amount'))
  const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('debit/credit'))
  const balanceIdx = headers.findIndex(h => h.includes('balance'))

  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 3) continue

    const amount = parseFloat(cols[amountIdx]?.replace(/[^0-9.-]/g, '') || '0')
    const type = typeIdx >= 0 
      ? (cols[typeIdx].toLowerCase().includes('credit') || cols[typeIdx].startsWith('+') ? 'credit' : 'debit')
      : (amount < 0 ? 'credit' : 'debit')

    transactions.push({
      date: parseDate(cols[dateIdx]),
      description: cols[descIdx] || 'Unknown',
      amount: Math.abs(amount),
      type,
      balance: balanceIdx >= 0 ? parseFloat(cols[balanceIdx]?.replace(/[^0-9.-]/g, '') || '0') : undefined
    })
  }

  return {
    bankName: 'Unknown Bank',
    accountNumber: 'Unknown',
    accountType: 'Unknown',
    currency: 'USD',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: transactions[transactions.length - 1]?.balance || 0,
    transactions
  }
}

function parseHSBCCSV(lines: string[]): ParsedStatement {
  // HSBC specific parsing
  const transactions: ParsedTransaction[] = []
  let accountInfo = { number: '', currency: 'USD' }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Look for account info
    if (line.includes('Account Number')) {
      accountInfo.number = line.split(',')[1]?.trim() || ''
    }
    
    // Parse transaction lines
    if (line.match(/^\d{2}\/\d{2}\/\d{4}/) || line.match(/^\d{4}-\d{2}-\d{2}/)) {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      if (cols.length >= 4) {
        const debit = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
        const credit = parseFloat(cols[3]?.replace(/[^0-9.-]/g, '') || '0')
        const balance = parseFloat(cols[4]?.replace(/[^0-9.-]/g, '') || '0')
        
        transactions.push({
          date: parseDate(cols[0]),
          description: cols[1],
          amount: debit > 0 ? debit : credit,
          type: debit > 0 ? 'debit' : 'credit',
          balance
        })
      }
    }
  }

  return {
    bankName: 'HSBC',
    accountNumber: maskAccountNumber(accountInfo.number),
    accountType: 'Current Account',
    currency: accountInfo.currency,
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: transactions[0]?.balance ? transactions[0].balance - (transactions[0].type === 'credit' ? transactions[0].amount : -transactions[0].amount) : 0,
    closingBalance: transactions[transactions.length - 1]?.balance || 0,
    transactions
  }
}

function parseChaseCSV(lines: string[]): ParsedStatement {
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 5) continue

    const amount = parseFloat(cols[4]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[3],
      amount: Math.abs(amount),
      type: amount < 0 ? 'credit' : 'debit'
    })
  }

  return {
    bankName: 'Chase Bank',
    accountNumber: '****',
    accountType: 'Checking',
    currency: 'USD',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

function parseCitiCSV(lines: string[]): ParsedStatement {
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 4) continue

    const debit = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
    const credit = parseFloat(cols[3]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[1],
      amount: debit > 0 ? debit : credit,
      type: debit > 0 ? 'debit' : 'credit'
    })
  }

  return {
    bankName: 'Citibank',
    accountNumber: '****',
    accountType: 'Account',
    currency: 'USD',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

function parseNBECSV(lines: string[]): ParsedStatement {
  // National Bank of Egypt specific format
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 4) continue

    const debit = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
    const credit = parseFloat(cols[3]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[1],
      amount: debit > 0 ? debit : credit,
      type: debit > 0 ? 'debit' : 'credit'
    })
  }

  return {
    bankName: 'National Bank of Egypt',
    accountNumber: '****',
    accountType: 'Account',
    currency: 'EGP',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

function parseCIBCSV(lines: string[]): ParsedStatement {
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 4) continue

    const amount = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[1],
      amount: Math.abs(amount),
      type: amount < 0 ? 'credit' : 'debit'
    })
  }

  return {
    bankName: 'Commercial International Bank (CIB)',
    accountNumber: '****',
    accountType: 'Account',
    currency: 'EGP',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

function parseFABCSV(lines: string[]): ParsedStatement {
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 4) continue

    const debit = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
    const credit = parseFloat(cols[3]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[1],
      amount: debit > 0 ? debit : credit,
      type: debit > 0 ? 'debit' : 'credit'
    })
  }

  return {
    bankName: 'First Abu Dhabi Bank',
    accountNumber: '****',
    accountType: 'Account',
    currency: 'AED',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

function parseADCBCSCV(lines: string[]): ParsedStatement {
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 4) continue

    const amount = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[1],
      amount: Math.abs(amount),
      type: amount < 0 ? 'credit' : 'debit'
    })
  }

  return {
    bankName: 'Abu Dhabi Commercial Bank',
    accountNumber: '****',
    accountType: 'Account',
    currency: 'AED',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

function parseEmiratesNBDCSCV(lines: string[]): ParsedStatement {
  const transactions: ParsedTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 4) continue

    const debit = parseFloat(cols[2]?.replace(/[^0-9.-]/g, '') || '0')
    const credit = parseFloat(cols[3]?.replace(/[^0-9.-]/g, '') || '0')
    
    transactions.push({
      date: parseDate(cols[0]),
      description: cols[1],
      amount: debit > 0 ? debit : credit,
      type: debit > 0 ? 'debit' : 'credit'
    })
  }

  return {
    bankName: 'Emirates NBD',
    accountNumber: '****',
    accountType: 'Account',
    currency: 'AED',
    statementPeriod: {
      from: transactions[0]?.date || new Date().toISOString().split('T')[0],
      to: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    openingBalance: 0,
    closingBalance: 0,
    transactions
  }
}

// Helper functions
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  
  // Try various formats
  const formats = [
    // DD/MM/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, fn: (m: string[]) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` },
    // MM/DD/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, fn: (m: string[]) => `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` },
    // YYYY-MM-DD
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, fn: (m: string[]) => `${m[1]}-${m[2]}-${m[3]}` },
    // DD-MM-YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, fn: (m: string[]) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }
  ]
  
  for (const format of formats) {
    const match = dateStr.match(format.regex)
    if (match) {
      try {
        const parsed = format.fn(match)
        // Validate it's a real date
        const d = new Date(parsed)
        if (!isNaN(d.getTime())) return parsed
      } catch {}
    }
  }
  
  // Fallback: try native parsing
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }
  
  return new Date().toISOString().split('T')[0]
}

function maskAccountNumber(account: string): string {
  if (!account || account.length < 4) return '****'
  return '****' + account.slice(-4)
}

export default BankStatementImporter
