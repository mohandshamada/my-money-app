import { useState, useMemo } from 'react'
import { Calculator, Plus, Trash2, Snowflake, Mountain } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

export interface DebtEntry {
  id: string
  name: string
  balance: number
  apr: number
  minimumPayment: number
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function payoffSimulation(
  debts: DebtEntry[],
  order: 'snowball' | 'avalanche',
  extraPayment: number
): { totalInterest: number; payoffMonth: number; order: DebtEntry[] } {
  const sorted =
    order === 'snowball'
      ? [...debts].sort((a, b) => a.balance - b.balance)
      : [...debts].sort((a, b) => b.apr - a.apr)

  const balances = sorted.map((d) => ({ ...d, balance: d.balance }))
  let totalInterest = 0
  let month = 0
  let availableExtra = extraPayment

  while (balances.some((d) => d.balance > 0)) {
    month++
    const monthlyInterest = balances.reduce((sum, d) => {
      if (d.balance <= 0) return sum
      const interest = (d.balance * (d.apr / 100)) / 12
      return sum + interest
    }, 0)
    totalInterest += monthlyInterest

    balances.forEach((d) => {
      if (d.balance <= 0) return
      const interest = (d.balance * (d.apr / 100)) / 12
      d.balance += interest
      const payment = Math.min(d.balance, d.minimumPayment)
      d.balance -= payment
    })

    const paidOff = balances.filter((d) => d.balance <= 0)
    const stillActive = balances.filter((d) => d.balance > 0)
    if (stillActive.length > 0 && availableExtra > 0) {
      const target =
        order === 'snowball'
          ? stillActive.reduce((min, d) => (d.balance < min.balance ? d : min), stillActive[0])
          : stillActive.reduce((max, d) => (d.apr > max.apr ? d : max), stillActive[0])
      const extra = Math.min(availableExtra, target.balance)
      target.balance -= extra
      availableExtra -= extra
      paidOff.forEach((d) => {
        const orig = sorted.find((s) => s.id === d.id)
        if (orig) availableExtra += orig.minimumPayment
      })
    }
  }

  return { totalInterest, payoffMonth: month, order: sorted }
}

export function DebtPayoffCalculator() {
  const { formatAmount } = useCurrency()
  const [debts, setDebts] = useState<DebtEntry[]>([
    { id: '1', name: 'Credit Card', balance: 5000, apr: 18.5, minimumPayment: 150 },
    { id: '2', name: 'Car Loan', balance: 12000, apr: 5.5, minimumPayment: 280 },
  ])
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('avalanche')
  const [extraPayment, setExtraPayment] = useState(100)

  const addDebt = () => {
    setDebts((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'New Debt',
        balance: 0,
        apr: 0,
        minimumPayment: 0,
      },
    ])
  }

  const updateDebt = (id: string, field: keyof DebtEntry, value: string | number) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: typeof value === 'string' ? value : value } : d))
    )
  }

  const removeDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id))
  }

  const validDebts = debts.filter((d) => d.balance > 0 && d.minimumPayment > 0)
  const snowball = useMemo(
    () => (validDebts.length ? payoffSimulation(validDebts, 'snowball', extraPayment) : null),
    [validDebts, extraPayment]
  )
  const avalanche = useMemo(
    () => (validDebts.length ? payoffSimulation(validDebts, 'avalanche', extraPayment) : null),
    [validDebts, extraPayment]
  )

  const result = strategy === 'snowball' ? snowball : avalanche
  const payoffDate = result
    ? addMonths(new Date(), result.payoffMonth)
    : null
  const snowballPayoffDate = snowball ? addMonths(new Date(), snowball.payoffMonth) : null
  const avalanchePayoffDate = avalanche ? addMonths(new Date(), avalanche.payoffMonth) : null

  return (
    <div className="card">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5" />
        Debt Payoff Calculator
      </h2>

      <div className="space-y-4">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className="p-4 rounded-lg border dark:border-gray-700 space-y-2"
          >
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={debt.name}
                onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                className="font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none w-32"
              />
              <button
                onClick={() => removeDebt(debt.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                aria-label="Remove debt"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <label className="text-xs text-gray-500">Balance</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={debt.balance || ''}
                  onChange={(e) => updateDebt(debt.id, 'balance', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">APR %</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={debt.apr || ''}
                  onChange={(e) => updateDebt(debt.id, 'apr', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Min payment</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={debt.minimumPayment || ''}
                  onChange={(e) =>
                    updateDebt(debt.id, 'minimumPayment', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addDebt}
          className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
        >
          <Plus className="h-4 w-4" /> Add debt
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Extra monthly payment ($)
        </label>
        <input
          type="number"
          min="0"
          value={extraPayment}
          onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
          className="w-full max-w-[120px] px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      <div className="flex gap-4 mt-4 border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => setStrategy('snowball')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            strategy === 'snowball'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Snowball (smallest first)
        </button>
        <button
          onClick={() => setStrategy('avalanche')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            strategy === 'avalanche'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Avalanche (highest APR first)
        </button>
      </div>

      {/* Snowball vs Avalanche comparison */}
      {(snowball || avalanche) && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Strategy comparison</p>
          <div className="grid grid-cols-2 gap-3">
            {snowball && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  strategy === 'snowball'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Snowflake className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-sm">Snowball</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Smallest balance first</p>
                <p className="text-sm mt-1">
                  <span className="text-gray-500">Payoff: </span>
                  <span className="font-semibold">
                    {snowballPayoffDate?.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-gray-500"> ({snowball.payoffMonth} mo)</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Interest: </span>
                  <span className="font-semibold text-red-600">{formatAmount(snowball.totalInterest)}</span>
                </p>
              </div>
            )}
            {avalanche && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  strategy === 'avalanche'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mountain className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-sm">Avalanche</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Highest APR first</p>
                <p className="text-sm mt-1">
                  <span className="text-gray-500">Payoff: </span>
                  <span className="font-semibold">
                    {avalanchePayoffDate?.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-gray-500"> ({avalanche.payoffMonth} mo)</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Interest: </span>
                  <span className="font-semibold text-red-600">{formatAmount(avalanche.totalInterest)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 space-y-2">
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Selected strategy total interest: </span>
            <span className="font-semibold text-red-600">{formatAmount(result.totalInterest)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Payoff date: </span>
            <span className="font-semibold">
              {payoffDate?.toLocaleDateString('default', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-gray-500"> ({result.payoffMonth} months)</span>
          </p>
        </div>
      )}
    </div>
  )
}
