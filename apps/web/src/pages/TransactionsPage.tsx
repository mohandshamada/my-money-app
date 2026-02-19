import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Download } from 'lucide-react'
import { RootState } from '../store'
import { fetchTransactions } from '../store/transactionSlice'

export function TransactionsPage() {
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state: RootState) => state.transactions)

  useEffect(() => {
    dispatch(fetchTransactions() as any)
  }, [dispatch])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Import CSV
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Merchant</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Loading...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No transactions yet. Add your first transaction!
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{t.merchant || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {t.category}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      t.isExpense ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {t.isExpense ? '-' : '+'}${t.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {t.pending ? (
                        <span className="text-yellow-600 text-sm">Pending</span>
                      ) : (
                        <span className="text-green-600 text-sm">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
