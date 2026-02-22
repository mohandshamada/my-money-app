import { CurrencySelector } from '../components/CurrencySelector'
import { useState } from 'react'

export function SettingsPage() {
  const [currency, setCurrency] = useState('USD')

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Currency</h2>
          <p className="text-sm text-gray-500 mb-3">Select your preferred currency for displaying amounts</p>
          <CurrencySelector value={currency} onChange={setCurrency} />
        </div>
      </div>
    </div>
  )
}