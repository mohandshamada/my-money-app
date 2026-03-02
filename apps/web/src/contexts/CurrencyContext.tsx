import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getExchangeRates, convertCurrency } from '../services/exchangeRates'

const CURRENCY_STORAGE_KEY = 'cashflow-display-currency'

// All supported currencies with symbols
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'AED', symbol: 'Dh', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: 'OR', name: 'Omani Rial' },
  { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
] as const

type CurrencyCode = (typeof CURRENCIES)[number]['code']

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatAmount: (amount: number, sourceCurrency?: CurrencyCode) => string
  convert: (amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode) => number
  ratesLoading: boolean
  ratesError: string | null
  exchangeRates: Record<string, Record<string, number>>
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
  
  const [exchangeRates, setExchangeRates] = useState<Record<string, Record<string, number>>>({})
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState<string | null>(null)

  // Fetch exchange rates on mount
  useEffect(() => {
    const loadRates = async () => {
      try {
        setRatesLoading(true)
        const rates = await getExchangeRates()
        setExchangeRates(rates)
        setRatesError(null)
      } catch (error) {
        console.error('Failed to load exchange rates:', error)
        setRatesError('Could not load exchange rates')
      } finally {
        setRatesLoading(false)
      }
    }
    
    loadRates()
  }, [])

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code)
    } catch (_) {}
  }, [])

  // Convert between any two currencies
  const convert = useCallback(
    (amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number => {
      if (fromCurrency === toCurrency) return amount
      return convertCurrency(amount, fromCurrency, toCurrency, exchangeRates)
    },
    [exchangeRates]
  )

  // Format amount - converts from source currency to display currency
  const formatAmount = useCallback(
    (amount: number, sourceCurrency: CurrencyCode = 'USD'): string => {
      const value = convert(amount, sourceCurrency, currency)
      const curr = CURRENCIES.find((c) => c.code === currency)
      const symbol = curr?.symbol ?? currency
      
      if (currency === 'JPY' || currency === 'VND' || currency === 'IDR') {
        return `${symbol}${Math.round(value).toLocaleString()}`
      }
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
    exchangeRates,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
