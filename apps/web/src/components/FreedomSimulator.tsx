import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Target, Clock } from 'lucide-react'

export function FreedomSimulator() {
  const [monthlySavings, setMonthlySavings] = useState(1000)
  const [currentNetWorth, setCurrentNetWorth] = useState(10000)
  const [annualReturn, setAnnualReturn] = useState(7)
  const [targetMonthly, setTargetMonthly] = useState(4000)
  const [withdrawalRate, setWithdrawalRate] = useState(4)

  const projection = useMemo(() => {
    const targetNetWorth = (targetMonthly * 12) / (withdrawalRate / 100)
    const monthlyReturn = annualReturn / 100 / 12
    
    let balance = currentNetWorth
    let months = 0
    const yearlyData = []
    
    // Project up to 40 years
    while (balance < targetNetWorth && months < 480) {
      balance = balance * (1 + monthlyReturn) + monthlySavings
      months++
      
      if (months % 12 === 0) {
        yearlyData.push({
          year: months / 12,
          balance: Math.round(balance),
          milestone: balance >= targetNetWorth
        })
      }
    }
    
    const yearsToFI = Math.floor(months / 12)
    const monthsRemainder = months % 12
    
    return {
      yearsToFI,
      monthsRemainder,
      targetNetWorth: Math.round(targetNetWorth),
      finalBalance: Math.round(balance),
      yearlyData: yearlyData.slice(0, 20)
    }
  }, [monthlySavings, currentNetWorth, annualReturn, targetMonthly, withdrawalRate])

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">Freedom Simulator</h3>
        <span className="text-xs text-gray-500">When can you retire?</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Savings: ${monthlySavings.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Current Net Worth: ${currentNetWorth.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={currentNetWorth}
              onChange={(e) => setCurrentNetWorth(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Expected Annual Return: {annualReturn}%
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Target Monthly Spending: ${targetMonthly.toLocaleString()}
            </label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="100"
              value={targetMonthly}
              onChange={(e) => setTargetMonthly(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Safe Withdrawal Rate: {withdrawalRate}%
            </label>
            <input
              type="range"
              min="3"
              max="5"
              step="0.25"
              value={withdrawalRate}
              onChange={(e) => setWithdrawalRate(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Big Number */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Time to Financial Freedom</p>
            <p className="text-4xl font-bold text-green-700">
              {projection.yearsToFI} years
              {projection.monthsRemainder > 0 && ` ${projection.monthsRemainder} months`}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Target: ${projection.targetNetWorth.toLocaleString()}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Savings Rate</p>
              <p className="font-semibold">${(monthlySavings * 12).toLocaleString()}/yr</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">FIRE Number</p>
              <p className="font-semibold">${projection.targetNetWorth.toLocaleString()}</p>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-24 flex items-end gap-1">
            {projection.yearlyData.map((d, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t ${d.milestone ? 'bg-green-500' : 'bg-primary-400'}`}
                style={{ 
                  height: `${Math.min(100, (d.balance / projection.targetNetWorth) * 100)}%` 
                }}
                title={`Year ${d.year}: $${d.balance.toLocaleString()}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Net worth projection over {Math.min(projection.yearsToFI + 5, 20)} years
          </p>
        </div>
      </div>
    </div>
  )
}