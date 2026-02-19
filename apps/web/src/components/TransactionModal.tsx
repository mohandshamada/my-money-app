import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().positive('Amount must be positive'),
  isExpense: z.boolean(),
  merchant: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  tags: z.string().optional(),
  pending: z.boolean().optional()
})

type FormData = z.infer<typeof schema>

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  initialData?: Partial<FormData>
}

const CATEGORIES = [
  'Income',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts',
  'Investments',
  'Other'
]

export function TransactionModal({ isOpen, onClose, onSubmit, initialData }: TransactionModalProps) {
  const [isExpense, setIsExpense] = useState(initialData?.isExpense ?? true)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initialData?.amount || 0,
      isExpense: initialData?.isExpense ?? true,
      merchant: initialData?.merchant || '',
      description: initialData?.description || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      category: initialData?.category || '',
      pending: false,
      ...initialData
    }
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit({ ...data, isExpense })
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {initialData ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsExpense(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isExpense 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setIsExpense(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isExpense 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium mb-1">Merchant / Source</label>
            <input
              type="text"
              {...register('merchant')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., Starbucks, Salary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              {...register('category')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Optional notes..."
            />
          </div>

          {/* Pending */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('pending')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Pending transaction</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {initialData ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
