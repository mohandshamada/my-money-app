import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { BudgetModal } from '../components/BudgetModal'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  remaining: number
  status: 'on_track' | 'overspent' | 'warning'
  periodType: string
  startDate: string
}

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBudgets(response.data.budgets || [])
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBudget = async (data: any) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/api/budgets`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBudgets()
    } catch (error) {
      console.error('Failed to create budget:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/budgets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBudgets()
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  const getProgressColor = (spent: number, budget: number) => {
    const ratio = spent / budget
    if (ratio >= 1) return 'bg-red-500'
    if (ratio >= 0.8) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return <span className="text-green-600 text-sm font-medium">✓ On Track</span>
      case 'warning':
        return <span className="text-yellow-600 text-sm font-medium">⚠ Warning</span>
      case 'overspent':
        return <span className="text-red-600 text-sm font-medium">✗ Over Budget</span>
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button 
          onClick={() => {
            setEditingBudget(null)
            setModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Budget
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-pulse">Loading budgets...</div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No budgets yet</p>
            <button 
              onClick={() => setModalOpen(true)}
              className="btn-primary"
            >
              Create Your First Budget
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Budgeted</p>
              <p className="text-2xl font-bold">
                ${budgets.reduce((s, b) => s + b.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">
                ${budgets.reduce((s, b) => s + b.spent, 0).toFixed(2)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
              <p className={`text-2xl font-bold ${
                budgets.reduce((s, b) => s + b.remaining, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${budgets.reduce((s, b) => s + b.remaining, 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Budget Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <div key={budget.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{budget.category}</h3>
                    <p className="text-sm text-gray-500 capitalize">{budget.periodType}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingBudget(budget)
                        setModalOpen(true)
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(budget.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">
                      ${budget.spent.toFixed(2)} spent
                    </span>
                    <span className="font-medium">${budget.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColor(budget.spent, budget.amount)}`}
                      style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {getStatusBadge(budget.status)}
                  <span className={`text-sm font-medium ${
                    budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {budget.remaining >= 0 ? '' : '-'}${Math.abs(budget.remaining).toFixed(2)} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingBudget(null)
        }}
        onSubmit={handleCreateBudget}
        initialData={editingBudget ? {
          category: editingBudget.category,
          amount: editingBudget.amount,
          periodType: editingBudget.periodType as any,
          startDate: editingBudget.startDate
        } : undefined}
      />
    </div>
  )
}
