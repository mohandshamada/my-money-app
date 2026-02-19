import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  periodType: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  rollover: z.boolean().optional()
})

type FormData = z.infer<typeof schema>

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  initialData?: Partial<FormData>
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Other'
]

const PERIOD_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly'
}

export function BudgetModal({ isOpen, onClose, onSubmit, initialData }: BudgetModalProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: initialData?.category || '',
      amount: initialData?.amount || 0,
      periodType: initialData?.periodType || 'monthly',
      startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      endDate: initialData?.endDate || '',
      rollover: initialData?.rollover || false,
      ...initialData
    }
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data)
    onClose()
  }

  if (!isOpen) return null

  const periodType = watch('periodType')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {initialData ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
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

          {/* Amount + Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Budget Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Period *</label>
              <select
                {...register('periodType')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              >
                {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Daily amount preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              ≈ ${periodType === 'monthly' 
                ? (watch('amount') / 30).toFixed(2) 
                : periodType === 'weekly' 
                ? (watch('amount') / 7).toFixed(2)
                : watch('amount')?.toFixed(2) || '0.00'} per day
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing budget</p>
          </div>

          {/* Rollover */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('rollover')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Rollover unused amount to next period</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {initialData ? 'Update' : 'Create'} Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
