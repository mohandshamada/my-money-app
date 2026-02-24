import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Download, Search } from 'lucide-react'
import { RootState } from '../store'
import { fetchTransactions } from '../store/transactionSlice'
import { TransactionModal } from '../components/TransactionModal'
import { useCurrency } from '../contexts/CurrencyContext'

export function TransactionsPage() {
  const { formatAmount } = useCurrency()
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state: RootState) => state.transactions)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    dispatch(fetchTransactions() as any)
  }, [dispatch])

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = !search || 
      t.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'income' && !t.isExpense) ||
      (filter === 'expense' && t.isExpense)
    
    return matchesSearch && matchesFilter
  })

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-3 w-full sm:w-auto">
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
          <p className="text-xl font-bold text-green-600">
            {formatAmount(transactions.filter(t => !t.isExpense).reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
          <p className="text-xl font-bold text-red-600">
            {formatAmount(transactions.filter(t => t.isExpense).reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Net</p>
          <p className={`text-xl font-bold ${
            transactions.reduce((s, t) => s + (t.isExpense ? -t.amount : t.amount), 0) >= 0 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {formatAmount(transactions.reduce((s, t) => s + (t.isExpense ? -t.amount : t.amount), 0))}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Description</th>
                <th className="text-left py-3 px-4 font-medium">Category</th>
                <th className="text-right py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {search || filter !== 'all' 
                      ? 'No transactions match your filters' 
                      : 'No transactions yet. Add your first transaction!'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr 
                    key={t.id} 
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
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
                      t.isExpense ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {t.isExpense ? '-' : '+'}
                      {formatAmount(t.amount)}
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
    </div>
  )
}
