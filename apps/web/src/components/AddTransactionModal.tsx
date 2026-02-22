import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { X, Calendar, Tag, Repeat } from 'lucide-react'
import { createTransaction } from '../store/transactionSlice'
import { AICategorizer } from './AICategorizer'
import { AppDispatch } from '../store'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️' },
  { id: 'transport', name: 'Transportation', icon: '🚗' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡' },
  { id: 'health', name: 'Health & Fitness', icon: '💪' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'income', name: 'Income', icon: '💰' },
  { id: 'other', name: 'Other', icon: '📦' },
]

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    isExpense: true,
    merchant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'food',
    tags: '',
    isRecurring: false,
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await dispatch(createTransaction({
        amount: parseFloat(formData.amount),
        isExpense: formData.isExpense,
        merchant: formData.merchant,
        description: formData.description,
        date: formData.date,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        isRecurring: formData.isRecurring,
      })).unwrap()

      onClose()
      setFormData({
        amount: '',
        isExpense: true,
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'food',
        tags: '',
        isRecurring: false,
      })
    } catch (error) {
      console.error('Failed to create transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Add Transaction</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isExpense: true })}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  formData.isExpense
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isExpense: false })}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  !formData.isExpense
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Merchant */}
            <div>
              <label className="block text-sm font-medium mb-1">Merchant / Payee</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Starbucks, Amazon"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                placeholder="Optional details..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              
              {/* AI Categorizer */}
              <div className="mb-3">
                <AICategorizer
                  merchant={formData.merchant}
                  description={formData.description}
                  amount={parseFloat(formData.amount) || 0}
                  onCategorySelect={(category) => setFormData({ ...formData, category })}
                />
              </div>
              
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                  placeholder="business, tax-deductible, vacation"
                />
              </div>
            </div>

            {/* Recurring Toggle */}
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Recurring Transaction</p>
                  <p className="text-sm text-gray-500">This repeats regularly</p>
                </div>
              </div>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}