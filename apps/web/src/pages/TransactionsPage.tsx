import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Download, Search, Upload, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { RootState } from '../store'
import { fetchTransactions, deleteTransaction, bulkDeleteTransactions } from '../store/transactionSlice'
import { TransactionModal } from '../components/TransactionModal'
import { useCurrency } from '../contexts/CurrencyContext'
import { AIStatementParser, AIStatementResult } from '../components/AIStatementParser'
import { InternalTransfers } from '../components/InternalTransfers'

export function TransactionsPage() {
  const { formatAmount } = useCurrency()
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state: RootState) => state.transactions)
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [dayFilter, setDayFilter] = useState<string>('all')
  const [bankFilter, setBankFilter] = useState<string>('all')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Open modal if ?add=true in URL
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setModalOpen(true)
      // Remove the query param
      searchParams.delete('add')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    dispatch(fetchTransactions() as any)
  }, [dispatch])

  // Helper functions
  const getAmount = (t: any) => Number(t?.amount?.toString().replace(/[^0-9.-]+/g,"")) || 0
  const isExpense = (t: any) => t?.isExpense === true || t?.is_expense === true || t?.type === 'debit' || Number(t?.amount) < 0

  // Helper function to extract bank name
  const extractBankName = (desc: string) => {
    if (!desc) return null;
    const match = desc.match(/Imported from ([^-]+)/);
    return match ? match[1].trim() : null;
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = !search || 
      t.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'income' && !isExpense(t)) ||
      (filter === 'expense' && isExpense(t))
    
    // Date filtering
    const txDate = new Date(t.date)
    const matchesYear = yearFilter === 'all' || txDate.getFullYear().toString() === yearFilter
    const matchesMonth = monthFilter === 'all' || (txDate.getMonth() + 1).toString() === monthFilter
    const matchesDay = dayFilter === 'all' || txDate.getDate().toString() === dayFilter

    // Bank filtering
    const txBankName = extractBankName(t.description);
    const matchesBank = bankFilter === 'all' || txBankName === bankFilter;
    
    return matchesSearch && matchesFilter && matchesYear && matchesMonth && matchesDay && matchesBank
  })

  // Get unique years and banks from transactions
  const availableYears = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear()))).sort((a, b) => b - a)
  const availableBanks = Array.from(new Set(transactions.map(t => extractBankName(t.description)).filter(Boolean))).sort()
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const handleAddTransaction = async (data: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
          tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create transaction')
      }

      dispatch(fetchTransactions() as any)
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction. Please try again.')
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transactions/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export transactions')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    try {
      await dispatch(deleteTransaction(id) as any)
    } catch (error) {
      alert('Failed to delete transaction')
    }
  }

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleAllSelection = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) return
    
    try {
      await dispatch(bulkDeleteTransactions(Array.from(selectedIds)) as any)
      setSelectedIds(new Set())
      alert(`Successfully deleted ${selectedIds.size} transactions.`)
    } catch (error) {
      alert('Failed to delete transactions')
    }
  }

  const handleImport = async (results: AIStatementResult[]) => {
    try {
      setImporting(true)
      const token = localStorage.getItem('token')
      
      // Collect all transactions from all results
      const allTransactions = results.flatMap(result =>
        result.transactions.map(tx => ({
          amount: tx.amount,
          type: tx.type,
          merchant: tx.merchant || tx.description?.slice(0, 50) || 'Unknown',
          description: `Imported from ${result.bankName}${result.accountNumber ? ` - ${result.accountNumber}` : ''}`,
          date: tx.date,
          category: tx.category || 'Other',
          currency: result.currency
        }))
      )
      
      if (allTransactions.length === 0) {
        alert('No transactions to import')
        setImporting(false)
        return
      }

      // Use bulk import endpoint
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactions: allTransactions
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Import failed' }))
        throw new Error(errorData.error || 'Import failed')
      }

      const data = await response.json()
      
      let message = `Successfully imported ${data.imported} transactions from ${results.length} statement(s)`
      if (data.duplicatesSkipped > 0) {
        message += ` (${data.duplicatesSkipped} duplicates skipped)`
      }
      if (data.errors > 0) {
        message += ` (${data.errors} errors)`
      }
      
      alert(message)
      setImportModalOpen(false)
      dispatch(fetchTransactions() as any)
    } catch (error: any) {
      console.error('Import failed:', error)
      alert('Failed to import transactions: ' + (error.message || 'Unknown error'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setImportModalOpen(true)}
            disabled={importing}
            className="btn-secondary flex items-center gap-2 flex-1 sm:flex-initial justify-center"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2 flex-1 sm:flex-initial justify-center"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center gap-2 flex-1 sm:flex-initial justify-center"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
      {/* Internal Transfers Scanner */}
      <div className="mb-6">
        <InternalTransfers onComplete={() => dispatch(fetchTransactions() as any)} />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        
        {/* Advanced Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All Banks</option>
            {availableBanks.map(bank => (
              <option key={bank as string} value={bank as string}>{bank as string}</option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All Months</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All Days</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day.toString()}>{day}</option>
            ))}
          </select>
          
          {(yearFilter !== 'all' || monthFilter !== 'all' || dayFilter !== 'all') && (
            <button
              onClick={() => {
                setYearFilter('all')
                setMonthFilter('all')
                setDayFilter('all')
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Date Filters
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
          <p className="text-xl font-bold text-green-600">
            {formatAmount(filteredTransactions.filter(t => !isExpense(t)).reduce((s, t) => s + getAmount(t), 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
          <p className="text-xl font-bold text-red-600">
            {formatAmount(filteredTransactions.filter(t => isExpense(t)).reduce((s, t) => s + getAmount(t), 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Net</p>
          <p className={`text-xl font-bold ${
            filteredTransactions.reduce((s, t) => s + (isExpense(t) ? -getAmount(t) : getAmount(t)), 0) >= 0 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {formatAmount(filteredTransactions.reduce((s, t) => s + (isExpense(t) ? -getAmount(t) : getAmount(t)), 0))}
          </p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg gap-2">
          <span className="text-sm text-red-700 dark:text-red-300">
            {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDelete}
            aria-label={`Delete ${selectedIds.size} selected transactions`}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete Selected</span>
            <span className="sm:hidden">Delete</span>
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-3 px-2 sm:px-4 text-center w-10 sm:w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={toggleAllSelection}
                    aria-label="Select all transactions"
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Description</th>
                <th className="text-left py-3 px-4 font-medium">Category</th>
                <th className="text-right py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-center py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    {search || filter !== 'all' || yearFilter !== 'all' || monthFilter !== 'all' || dayFilter !== 'all'
                      ? 'No transactions match your filters' 
                      : 'No transactions yet. Add your first transaction!'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr 
                    key={t.id} 
                    className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${selectedIds.has(t.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <td className="py-3 px-2 sm:px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelection(t.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select transaction from ${new Date(t.date).toLocaleDateString()}`}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{t.merchant || 'Transaction'}</p>
                        {t.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{t.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {t.category}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      isExpense(t) ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {isExpense(t) ? '-' : '+'}
                      {formatAmount(getAmount(t))}
                    </td>
                    <td className="py-3 px-4">
                      {t.pending ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                        aria-label="Delete transaction"
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

      {importModalOpen && (
        <AIStatementParser
          onImport={handleImport}
          onClose={() => setImportModalOpen(false)}
        />
      )}
    </div>
  )
}
