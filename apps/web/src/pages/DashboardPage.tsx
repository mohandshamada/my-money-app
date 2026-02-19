import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'
import { RootState } from '../store'
import { fetchTransactions } from '../store/transactionSlice'

export function DashboardPage() {
  const dispatch = useDispatch()
  const { transactions } = useSelector((state: RootState) => state.transactions)

  useEffect(() => {
    dispatch(fetchTransactions() as any)
  }, [dispatch])

  // Calculate stats
  const income = transactions
    .filter(t => !t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter(t => t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = income - expenses

  const stats = [
    { title: 'Current Balance', value: `$${balance.toFixed(2)}`, icon: DollarSign, trend: 'neutral' },
    { title: 'Income', value: `$${income.toFixed(2)}`, icon: TrendingUp, trend: 'up' },
    { title: 'Expenses', value: `$${expenses.toFixed(2)}`, icon: TrendingDown, trend: 'down' },
    { title: 'Savings Rate', value: `${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%`, icon: PiggyBank, trend: 'up' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100 text-green-600' :
                stat.trend === 'down' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                <div>
                  <p className="font-medium">{t.merchant || t.category}</p>
                  <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-semibold ${t.isExpense ? 'text-red-600' : 'text-green-600'}`}>
                  {t.isExpense ? '-' : '+'}${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/transactions" className="block p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100">
              <p className="font-medium">Add Transaction</p>
              <p className="text-sm text-gray-600">Record a new income or expense</p>
            </a>
            <a href="/budgets" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100">
              <p className="font-medium">Set Up Budget</p>
              <p className="text-sm text-gray-600">Create a budget for this month</p>
            </a>
            <a href="/forecast" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100">
              <p className="font-medium">View Forecast</p>
              <p className="text-sm text-gray-600">See your financial future</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
