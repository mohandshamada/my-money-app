import { useState } from 'react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

export function DataExport() {
  const [exporting, _setExporting] = useState(false)
  const transactions = useSelector((state: RootState) => state.transactions.transactions)
  const budgets = useSelector((state: RootState) => state.budgets.budgets)

  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      summary: {
        totalTransactions: transactions.length,
        totalBudgets: budgets.length
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadFile(blob, 'mymoney-export.json')
  }

  const exportToCSV = () => {
    // Transactions CSV
    const txHeaders = ['Date', 'Description', 'Category', 'Amount', 'Type']
    const txRows = transactions.map(t => [
      t.date,
      t.merchant || t.description,
      t.category,
      t.amount.toString(),
      t.isExpense ? 'Expense' : 'Income'
    ])
    
    const csv = [txHeaders, ...txRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    downloadFile(blob, 'mymoney-transactions.csv')
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Export Your Data</h3>
        <span className="text-xs text-gray-500">Your data belongs to you</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Download all your financial data anytime. Your data is yours forever.
      </p>

      <div className="flex gap-3">
        <button
          onClick={exportToJSON}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FileJson className="h-4 w-4" />
          Export JSON
        </button>
        
        <button
          onClick={exportToCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        {transactions.length} transactions • {budgets.length} budgets
      </p>
    </div>
  )
}