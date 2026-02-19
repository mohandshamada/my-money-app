import { TrendingUp, Calendar } from 'lucide-react'

export function ForecastPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cash Flow Forecast</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">30-Day Projection</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded">30 Days</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">90 Days</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">1 Year</button>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>Chart will appear here</p>
              <p className="text-sm">Add transactions to see your forecast</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Projected (30 days)</p>
                <p className="text-2xl font-bold text-primary-600">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence Interval</p>
                <p className="text-lg">$0 - $0</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">What-If Scenarios</h3>
            <button className="w-full btn-secondary">
              Create Scenario
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar View
        </h2>
        <p className="text-gray-500">Calendar view coming soon...</p>
      </div>
    </div>
  )
}
