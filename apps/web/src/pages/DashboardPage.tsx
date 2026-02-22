import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, RefreshCw, Award } from 'lucide-react'
import { RootState } from '../store'
import { fetchTransactions } from '../store/transactionSlice'
import { SpendingChart, BalanceHistoryChart } from '../components/Charts'
import { SafeToSpend } from '../components/SafeToSpend'
import { ProjectedCashFlow } from '../components/ProjectedCashFlow'
import { AIHub, AIFab } from '../components/AIHub'
import { MonthInReview } from '../components/MonthInReview'
import { BudgetRebalancer, useBudgetAlert } from '../components/BudgetRebalancer'

export function DashboardPage() {
  const dispatch = useDispatch()
  const [showAIHub, setShowAIHub] = useState(false)
  const [showMonthReview, setShowMonthReview] = useState(false)
  const [showRebalancer, setShowRebalancer] = useState(false)
  const budgetAlert = useBudgetAlert()
  const { transactions } = useSelector((state: RootState) => state.transactions)

  useEffect(() => {
    dispatch(fetchTransactions() as any)
  }, [dispatch])

  // Calculate stats
  const stats = useMemo(() => {
    const income = transactions
      .filter(t => !t.isExpense)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.isExpense)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const balance = income - expenses
    const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0

    return { income, expenses, balance, savingsRate }
  }, [transactions])

  // Category spending for chart
  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>()
    
    transactions
      .filter(t => t.isExpense)
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0
        categoryMap.set(t.category, current + t.amount)
      })
    
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  }, [transactions])

  // Balance history for chart (last 30 days)
  const balanceHistory = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    let runningBalance = 0
    return sorted.slice(-30).map(t => {
      runningBalance += t.isExpense ? -t.amount : t.amount
      return {
        date: t.date,
        balance: runningBalance
      }
    })
  }, [transactions])

  const statCards = [
    { 
      title: 'Current Balance', 
      value: `$${stats.balance.toFixed(2)}`, 
      icon: DollarSign, 
      trend: stats.balance >= 0 ? 'up' : 'down',
      color: stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
    },
    { 
      title: 'Income', 
      value: `$${stats.income.toFixed(2)}`, 
      icon: TrendingUp, 
      trend: 'up',
      color: 'text-green-600'
    },
    { 
      title: 'Expenses', 
      value: `$${stats.expenses.toFixed(2)}`, 
      icon: TrendingDown, 
      trend: 'down',
      color: 'text-red-600'
    },
    { 
      title: 'Savings Rate', 
      value: `${stats.savingsRate.toFixed(1)}%`, 
      icon: PiggyBank, 
      trend: stats.savingsRate >= 20 ? 'up' : 'down',
      color: stats.savingsRate >= 20 ? 'text-green-600' : 'text-yellow-600'
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Feature Widgets */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <SafeToSpend />
        </div>
        <div className="lg:col-span-2">
          <ProjectedCashFlow />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Balance History</h2>
          <BalanceHistoryChart data={balanceHistory} />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
          <SpendingChart data={spendingByCategory} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <a href="/transactions" className="text-primary-600 text-sm hover:underline">
              View All →
            </a>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 6).map((t) => (
              <div 
                key={t.id} 
                className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    t.isExpense ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {t.isExpense ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{t.merchant || t.category}</p>
                    <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-semibold ${t.isExpense ? 'text-red-600' : 'text-green-600'}`}>
                  {t.isExpense ? '-' : '+'}${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowMonthReview(true)}
              className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <p className="font-medium text-purple-800 dark:text-purple-400">Month in Review</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">See your spending highlights</p>
            </button>
            
            {budgetAlert?.showRebalancer && (
              <button
                onClick={() => setShowRebalancer(true)}
                className="w-full text-left p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-yellow-600" />
                    <p className="font-medium text-yellow-800 dark:text-yellow-400">Rebalance Budget</p>
                  </div>
                  <span className="text-xs bg-yellow-200 px-2 py-1 rounded-full">{budgetAlert.message}</span>
                </div>
              </button>
            )}
            
            <a 
              href="/transactions" 
              className="block p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <p className="font-medium text-primary-700 dark:text-primary-400">Add Transaction</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record a new income or expense</p>
            </a>
            <a 
              href="/budgets" 
              className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="font-medium">Set Up Budget</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a budget for this month</p>
            </a>
          </div>
        </div>
      </div>

      {/* AI Hub */}
      {showAIHub && <AIHub onClose={() => setShowAIHub(false)} />}
      
      {/* Month in Review */}
      {showMonthReview && <MonthInReview isOpen={showMonthReview} onClose={() => setShowMonthReview(false)} />}
      
      {/* Budget Rebalancer */}
      {showRebalancer && <BudgetRebalancer isOpen={showRebalancer} onClose={() => setShowRebalancer(false)} />}
      
      {/* AI FAB */}
      <AIFab onClick={() => setShowAIHub(true)} />
    </div>
  )
}
