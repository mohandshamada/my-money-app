import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const CURRENCY_STORAGE_KEY = 'cashflow-display-currency'

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const

type CurrencyCode = (typeof CURRENCIES)[number]['code']

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatAmount: (amountUsd: number) => string
  convert: (amountUsd: number) => number
  ratesLoading: boolean
  ratesError: string | null
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY)
      if (saved && CURRENCIES.some((c) => c.code === saved)) return saved as CurrencyCode
    } catch (_) {}
    return 'USD'
  })
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState<string | null>(null)

  useEffect(() => {
    const codes = CURRENCIES.map((c) => c.code).join(',')
    fetch(`https://api.frankfurter.app/latest?from=USD&to=${codes}`)
      .then((res) => res.json())
      .then((data) => {
        setRates({ USD: 1, ...data.rates })
        setRatesError(null)
      })
      .catch(() => setRatesError('Could not load exchange rates'))
      .finally(() => setRatesLoading(false))
  }, [])

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code)
    } catch (_) {}
  }, [])

  const convert = useCallback(
    (amountUsd: number): number => {
      const rate = rates[currency] ?? 1
      return amountUsd * rate
    },
    [rates, currency]
  )

  const formatAmount = useCallback(
    (amountUsd: number): string => {
      const value = convert(amountUsd)
      const curr = CURRENCIES.find((c) => c.code === currency)
      const symbol = curr?.symbol ?? currency
      if (currency === 'JPY') return `${symbol}${Math.round(value).toLocaleString()}`
      return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    [convert, currency]
  )

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    formatAmount,
    convert,
    ratesLoading,
    ratesError,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
