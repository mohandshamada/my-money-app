import { Plus } from 'lucide-react'

export function BudgetsPage() {
  const budgets = []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No budgets yet</p>
          <button className="btn-primary">Create Your First Budget</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget: any) => (
            <div key={budget.id} className="card">
              <h3 className="font-semibold mb-2">{budget.category}</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>${budget.spent?.toFixed(2)} spent</span>
                  <span>${budget.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-primary-600 rounded-full"
                    style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {budget.status === 'on_track' ? '✓ On track' : '⚠ Over budget'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
