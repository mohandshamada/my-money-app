import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

export function CashFlowSankey() {
  const transactions = useSelector((state: RootState) => state.transactions.transactions)

  const flowData = useMemo(() => {
    const income: Record<string, number> = {}
    const expenses: Record<string, number> = {}
    
    transactions.forEach(t => {
      if (t.isExpense) {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount
      } else {
        income[t.category] = (income[t.category] || 0) + t.amount
      }
    })

    const totalIncome = Object.values(income).reduce((a, b) => a + b, 0)
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
    const savings = totalIncome - totalExpenses

    return {
      income: Object.entries(income).map(([name, value]) => ({ name, value })),
      expenses: Object.entries(expenses).map(([name, value]) => ({ name, value })),
      totalIncome,
      totalExpenses,
      savings
    }
  }, [transactions])

  const maxValue = Math.max(flowData.totalIncome, flowData.totalExpenses)

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Cash Flow</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Income Sources */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Income</h4>
          {flowData.income.map(({ name, value }) => (
            <div key={name} className="relative">
              <div
                className="h-8 bg-green-500 rounded-l flex items-center px-3 text-white text-sm"
                style={{ width: `${(value / maxValue) * 100}%` }}
              >
                <span className="truncate capitalize">{name}</span>
              </div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                ${value.toFixed(0)}
              </span>
            </div>
          ))}
        </div>

        {/* Center Flow */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-600">${flowData.totalIncome.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Total Income</p>
          </div>
          
          <div className="w-1 h-20 bg-gradient-to-b from-green-500 via-blue-500 to-red-500 rounded" />
          
          <div className="text-center mt-4">
            <p className={`text-2xl font-bold ${flowData.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {flowData.savings >= 0 ? '+' : ''}{flowData.savings.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">{flowData.savings >= 0 ? 'Saved' : 'Deficit'}</p>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase text-right">Expenses</h4>
          {flowData.expenses.map(({ name, value }) => (
            <div key={name} className="relative flex justify-end">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                ${value.toFixed(0)}
              </span>
              <div
                className="h-8 bg-red-500 rounded-r flex items-center justify-end px-3 text-white text-sm"
                style={{ width: `${(value / maxValue) * 100}%` }}
              >
                <span className="truncate capitalize">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-green-600">${flowData.totalIncome.toFixed(0)}</p>
          <p className="text-xs text-gray-500">In</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-red-600">${flowData.totalExpenses.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Out</p>
        </div>
        <div>
          <p className={`text-lg font-semibold ${flowData.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${Math.abs(flowData.savings).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500">{flowData.savings >= 0 ? 'Saved' : 'Over'}</p>
        </div>
      </div>
    </div>
  )
}