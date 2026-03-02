import { useMemo, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  Trash2,
  Edit2,
  Plus,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { RootState } from '../store'
import { useCurrency } from '../contexts/CurrencyContext'
import axios from 'axios'
import { getExchangeRates, convertCurrency as convertCurrencyService } from '../services/exchangeRates'

const API_URL = import.meta.env.VITE_API_URL || ''

// Fallback rates if API fails
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1, EGP: 50.5, EUR: 0.92, GBP: 0.79, AUD: 1.52, CAD: 1.36, AED: 3.67, SAR: 3.75, JPY: 150, CNY: 7.2, CHF: 0.88, NZD: 1.65, SEK: 10.5, NOK: 10.8, DKK: 6.9, SGD: 1.35, HKD: 7.8, KRW: 1330, INR: 83, BRL: 4.95, MXN: 17.1, ZAR: 19.0, RUB: 90, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38, JOD: 0.71, ILS: 3.7, TRY: 31, NGN: 1500, KES: 157, GHS: 12.5, MAD: 10.1, TND: 3.12, THB: 36, MYR: 4.75, IDR: 15600, PHP: 56, VND: 24500, TWD: 31.5, PKR: 280, BDT: 110, LKR: 315, PLN: 4.0, CZK: 23.5, HUF: 360, RON: 4.6, BGN: 1.8, HRK: 7.0, RSD: 109, UAH: 38, ARS: 830, CLP: 970, COP: 3900, PEN: 3.75, UYU: 39, VES: 36, BTC: 0.000015, ETH: 0.00028 },
  EGP: { USD: 0.020, EGP: 1, EUR: 0.018, GBP: 0.016, AED: 0.073, SAR: 0.075 },
  EUR: { USD: 1.09, EGP: 55.2, EUR: 1, GBP: 0.86, AUD: 1.66, CAD: 1.48 },
  GBP: { USD: 1.27, EGP: 64.1, EUR: 1.17, AUD: 1.93, CAD: 1.72 },
  AUD: { USD: 0.66, EGP: 33.2, EUR: 0.60, GBP: 0.52, AUD: 1, CAD: 0.89 },
  CAD: { USD: 0.74, EGP: 37.1, EUR: 0.68, GBP: 0.58, AUD: 1.12, CAD: 1 },
  AED: { USD: 0.27, EGP: 13.7, AED: 1, SAR: 1.02 },
  SAR: { USD: 0.27, EGP: 13.3, AED: 0.98, SAR: 1 },
  JPY: { USD: 0.0067, JPY: 1 },
  CNY: { USD: 0.14, CNY: 1 },
  CHF: { USD: 1.14, CHF: 1 },
  NZD: { USD: 0.61, NZD: 1 },
  SEK: { USD: 0.095, SEK: 1 },
  NOK: { USD: 0.093, NOK: 1 },
  DKK: { USD: 0.15, DKK: 1 },
  SGD: { USD: 0.74, SGD: 1 },
  HKD: { USD: 0.13, HKD: 1 },
  KRW: { USD: 0.00075, KRW: 1 },
  INR: { USD: 0.012, INR: 1 },
  BRL: { USD: 0.20, BRL: 1 },
  MXN: { USD: 0.058, MXN: 1 },
  ZAR: { USD: 0.053, ZAR: 1 },
  RUB: { USD: 0.011, RUB: 1 },
  QAR: { USD: 0.27, QAR: 1 },
  KWD: { USD: 3.25, KWD: 1 },
  BHD: { USD: 2.65, BHD: 1 },
  OMR: { USD: 2.60, OMR: 1 },
  JOD: { USD: 1.41, JOD: 1 },
  ILS: { USD: 0.27, ILS: 1 },
  TRY: { USD: 0.032, TRY: 1 },
  NGN: { USD: 0.00067, NGN: 1 },
  KES: { USD: 0.0064, KES: 1 },
  GHS: { USD: 0.080, GHS: 1 },
  MAD: { USD: 0.099, MAD: 1 },
  TND: { USD: 0.32, TND: 1 },
  THB: { USD: 0.028, THB: 1 },
  MYR: { USD: 0.21, MYR: 1 },
  IDR: { USD: 0.000064, IDR: 1 },
  PHP: { USD: 0.018, PHP: 1 },
  VND: { USD: 0.000041, VND: 1 },
  TWD: { USD: 0.032, TWD: 1 },
  PKR: { USD: 0.0036, PKR: 1 },
  BDT: { USD: 0.0091, BDT: 1 },
  LKR: { USD: 0.0032, LKR: 1 },
  PLN: { USD: 0.25, PLN: 1 },
  CZK: { USD: 0.043, CZK: 1 },
  HUF: { USD: 0.0028, HUF: 1 },
  RON: { USD: 0.22, RON: 1 },
  BGN: { USD: 0.56, BGN: 1 },
  HRK: { USD: 0.14, HRK: 1 },
  RSD: { USD: 0.0092, RSD: 1 },
  UAH: { USD: 0.026, UAH: 1 },
  ARS: { USD: 0.0012, ARS: 1 },
  CLP: { USD: 0.0010, CLP: 1 },
  COP: { USD: 0.00026, COP: 1 },
  PEN: { USD: 0.27, PEN: 1 },
  UYU: { USD: 0.026, UYU: 1 },
  VES: { USD: 0.028, VES: 1 },
  BTC: { USD: 67000, BTC: 1 },
  ETH: { USD: 3600, ETH: 1 }
}

const SUBSCRIPTION_CURRENCIES = [
  // Major Global Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
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
  // Middle East & Africa
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'MAD', symbol: 'د.م', name: 'Moroccan Dirham' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
  // Asia Pacific
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  // Europe
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  // Americas
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
  { code: 'VES', symbol: 'Bs', name: 'Venezuelan Bolivar' },
  // Others
  { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum' },
]

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  frequency: 'monthly' | 'yearly' | 'weekly'
  nextBilling: string
  category: string
  subCategory?: string
  autoRenew: boolean
}

interface Category {
  id: string
  name: string
  icon: string
  subCategories?: { id: string; name: string }[]
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'streaming', name: 'Streaming', icon: '🎬', subCategories: [
    { id: 'movies', name: 'Movies & TV' },
    { id: 'sports', name: 'Sports' },
    { id: 'live-tv', name: 'Live TV' },
  ]},
  { id: 'ai', name: 'AI Tools', icon: '🤖', subCategories: [
    { id: 'chatbots', name: 'Chatbots (ChatGPT, Claude)' },
    { id: 'image-gen', name: 'Image Generation' },
    { id: 'code-assist', name: 'Code Assistance' },
    { id: 'writing', name: 'Writing & Content' },
    { id: 'voice', name: 'Voice & Audio' },
    { id: 'other-ai', name: 'Other AI Tools' },
  ]},
  { id: 'software', name: 'Software', icon: '💻', subCategories: [
    { id: 'productivity', name: 'Productivity' },
    { id: 'design', name: 'Design & Creative' },
    { id: 'development', name: 'Development' },
    { id: 'security', name: 'Security & VPN' },
    { id: 'office', name: 'Office Suite' },
  ]},
  { id: 'music', name: 'Music', icon: '🎵', subCategories: [
    { id: 'streaming-music', name: 'Streaming' },
    { id: 'production', name: 'Production' },
    { id: 'learning', name: 'Learning' },
  ]},
  { id: 'gaming', name: 'Gaming', icon: '🎮', subCategories: [
    { id: 'console', name: 'Console Services' },
    { id: 'pc-gaming', name: 'PC Gaming' },
    { id: 'cloud-gaming', name: 'Cloud Gaming' },
  ]},
  { id: 'fitness', name: 'Fitness', icon: '💪', subCategories: [
    { id: 'gym', name: 'Gym Membership' },
    { id: 'apps', name: 'Fitness Apps' },
    { id: 'equipment', name: 'Equipment Rental' },
  ]},
  { id: 'news', name: 'News', icon: '📰', subCategories: [
    { id: 'digital', name: 'Digital News' },
    { id: 'magazines', name: 'Magazines' },
    { id: 'premium', name: 'Premium Content' },
  ]},
  { id: 'cloud', name: 'Cloud Storage', icon: '☁️', subCategories: [
    { id: 'personal', name: 'Personal Storage' },
    { id: 'business', name: 'Business Storage' },
    { id: 'backup', name: 'Backup Services' },
  ]},
  { id: 'shopping', name: 'Shopping', icon: '🛍️', subCategories: [
    { id: 'prime', name: 'Prime Memberships' },
    { id: 'delivery', name: 'Delivery Services' },
    { id: 'discount', name: 'Discount Clubs' },
    { id: 'clothing', name: 'Clothing & Fashion' },
    { id: 'beauty', name: 'Beauty & Personal Care' },
    { id: 'home', name: 'Home & Garden' },
    { id: 'electronics', name: 'Electronics & Tech' },
    { id: 'books', name: 'Books & Magazines' },
    { id: 'toys', name: 'Toys & Hobbies' },
    { id: 'sports', name: 'Sports & Outdoors' },
    { id: 'pet', name: 'Pet Supplies' },
    { id: 'auto', name: 'Automotive' },
    { id: 'luxury', name: 'Luxury & Premium' },
    { id: 'wholesale', name: 'Wholesale Clubs' },
    { id: 'subscription-box', name: 'Subscription Boxes' },
  ]},
  { id: 'food', name: 'Food & Drink', icon: '🍔', subCategories: [
    { id: 'meal-kits', name: 'Meal Kits' },
    { id: 'delivery-apps', name: 'Delivery Apps' },
    { id: 'coffee', name: 'Coffee Subscriptions' },
  ]},
  { id: 'transport', name: 'Transport', icon: '🚗', subCategories: [
    { id: 'ride-share', name: 'Ride Share' },
    { id: 'car-rental', name: 'Car Rental' },
    { id: 'public-transit', name: 'Public Transit' },
  ]},
  { id: 'finance', name: 'Finance', icon: '💰', subCategories: [
    { id: 'investing', name: 'Investing Tools' },
    { id: 'budgeting', name: 'Budgeting Apps' },
    { id: 'credit-score', name: 'Credit Monitoring' },
  ]},
  { id: 'learning', name: 'Learning', icon: '📚', subCategories: [
    { id: 'courses', name: 'Online Courses' },
    { id: 'languages', name: 'Language Learning' },
    { id: 'books', name: 'E-Books & Audiobooks' },
  ]},
  { id: 'other', name: 'Other', icon: '📦' },
]

export function SubscriptionManager() {
  const transactions = useSelector((state: RootState) => state.transactions.transactions)
  const { currency: displayCurrency } = useCurrency()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  // Open modal if ?add=true in URL
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
      // Remove the query param
      searchParams.delete('add')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Load custom categories from localStorage
  const [customCategories, setCustomCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('subscriptionCategories')
    return saved ? JSON.parse(saved) : []
  })

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦')
  const [newCategorySubCats, setNewCategorySubCats] = useState<string[]>([])
  const [newSubCatInput, setNewSubCatInput] = useState('')

  // Combined categories (default + custom)
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]

  // Save custom categories to localStorage when they change
  const saveCustomCategory = (name: string, icon: string, subCats?: string[]) => {
    const subCategories = subCats?.filter(s => s.trim()).map((name, idx) => ({
      id: `custom-sub-${Date.now()}-${idx}`,
      name: name.trim()
    }))

    const newCategory: Category = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      icon: icon || '📦',
      ...(subCategories && subCategories.length > 0 ? { subCategories } : {})
    }
    const updated = [...customCategories, newCategory]
    setCustomCategories(updated)
    localStorage.setItem('subscriptionCategories', JSON.stringify(updated))
  }

  // Add sub-category to existing custom category
  const addSubCategoryToCustom = (categoryId: string, subCatName: string) => {
    const updated = customCategories.map(cat => {
      if (cat.id === categoryId) {
        const existingSubs = cat.subCategories || []
        return {
          ...cat,
          subCategories: [...existingSubs, {
            id: `custom-sub-${Date.now()}`,
            name: subCatName.trim()
          }]
        }
      }
      return cat
    })
    setCustomCategories(updated)
    localStorage.setItem('subscriptionCategories', JSON.stringify(updated))
  }

  // Delete sub-category from custom category
  const deleteSubCategory = (categoryId: string, subCatId: string) => {
    const updated = customCategories.map(cat => {
      if (cat.id === categoryId && cat.subCategories) {
        return {
          ...cat,
          subCategories: cat.subCategories.filter(sub => sub.id !== subCatId)
        }
      }
      return cat
    })
    setCustomCategories(updated)
    localStorage.setItem('subscriptionCategories', JSON.stringify(updated))
  }

  const deleteCustomCategory = (id: string) => {
    const updated = customCategories.filter(c => c.id !== id)
    setCustomCategories(updated)
    localStorage.setItem('subscriptionCategories', JSON.stringify(updated))
  }

  // Auto-detect subscriptions from transactions
  const detectedSubscriptions = useMemo(() => {
    const potentialSubs = transactions
      .filter(t => (t.isExpense || (t as any).is_expense) && (t.merchant || t.description))
      .reduce((acc, t) => {
        const key = (t.merchant || t.description || '').toLowerCase()
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(t)
        return acc
      }, {} as Record<string, typeof transactions>)

    // Find merchants with 2+ transactions of similar amounts
    return Object.entries(potentialSubs)
      .filter(([, txns]) => txns.length >= 2)
      .map(([name, txns]) => ({
        id: `auto-${name}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        amount: txns[0].amount,
        frequency: 'monthly' as const,
        nextBilling: calculateNextBilling(txns),
        category: detectCategory(name),
        autoRenew: true,
        isDetected: true,
      }))
      .slice(0, 10) // Top 10 potential subscriptions
  }, [transactions])

  // Fetch subscriptions from API
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<Record<string, Record<string, number>>>(FALLBACK_RATES)
  const token = localStorage.getItem('token')

  // Fetch exchange rates directly from internet
  useEffect(() => {
    const loadRates = async () => {
      const rates = await getExchangeRates()
      setExchangeRates(rates)
    }
    loadRates()
  }, [])

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        // Transform snake_case to camelCase
        const subs = response.data.subscriptions?.map((s: any) => ({
          id: s.id,
          name: s.name,
          amount: parseFloat(s.amount),
          currency: s.currency,
          frequency: s.frequency,
          nextBilling: s.next_billing?.split('T')[0] || s.nextBilling,
          category: s.category,
          autoRenew: s.auto_renew ?? s.autoRenew
        })) || []
        setSubscriptions(subs)
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
      }
    }
    fetchSubscriptions()
  }, [token])

  const monthlyTotal = useMemo(() => {
    console.log('=== Calculating Monthly Total ===')
    console.log('Display currency:', displayCurrency)
    console.log('Exchange rates sample:', exchangeRates['USD']?.['AUD'], exchangeRates['EGP']?.['AUD'])
    
    let runningTotal = 0
    
    subscriptions.forEach((sub, index) => {
      const convertedAmount = convertCurrencyService(sub.amount, sub.currency, displayCurrency, exchangeRates)
      
      let monthlyAmount = convertedAmount
      if (sub.frequency === 'yearly') monthlyAmount = convertedAmount / 12
      else if (sub.frequency === 'weekly') monthlyAmount = convertedAmount * 4.33
      
      console.log(`Sub ${index}: ${sub.name} | ${sub.amount} ${sub.currency} | freq: ${sub.frequency} | converted: ${convertedAmount.toFixed(2)} ${displayCurrency} | monthly: ${monthlyAmount.toFixed(2)}`)
      
      runningTotal += monthlyAmount
    })
    
    console.log('Raw total before rounding:', runningTotal)
    console.log('Final monthly total:', runningTotal.toFixed(2))
    return runningTotal
  }, [subscriptions, displayCurrency, exchangeRates])

  const yearlyTotal = monthlyTotal * 12

  const upcomingRenewals = useMemo(() => {
    const today = new Date()
    const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return subscriptions.filter(sub => {
      const billingDate = new Date(sub.nextBilling)
      return billingDate >= today && billingDate <= sevenDays
    })
  }, [subscriptions])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return
    
    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscriptions(subs => subs.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete subscription:', error)
      alert('Failed to delete subscription')
    } finally {
      setLoading(false)
    }
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'monthly': return '/mo'
      case 'yearly': return '/yr'
      case 'weekly': return '/wk'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-sm">Monthly Subscriptions</p>
          <p className="text-2xl font-bold">{SUBSCRIPTION_CURRENCIES.find(c => c.code === displayCurrency)?.symbol}{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-purple-100 text-sm">{subscriptions.length} active • Converted to {displayCurrency}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-orange-100 text-sm">Yearly Cost</p>
          <p className="text-2xl font-bold">{SUBSCRIPTION_CURRENCIES.find(c => c.code === displayCurrency)?.symbol}{yearlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-orange-100 text-sm">What you pay annually</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-4 text-white">
          <p className="text-green-100 text-sm">Upcoming (7 days)</p>
          <p className="text-2xl font-bold">{upcomingRenewals.length}</p>
          <p className="text-green-100 text-sm">renewals due</p>
        </div>
      </div>

      {/* Upcoming Renewals Alert */}
      {upcomingRenewals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Upcoming Renewals</h3>
          </div>
          <div className="space-y-2">
            {upcomingRenewals.map(sub => {
              const convertedAmount = convertCurrencyService(sub.amount, sub.currency, displayCurrency, exchangeRates)
              const currencySymbol = SUBSCRIPTION_CURRENCIES.find(c => c.code === displayCurrency)?.symbol || displayCurrency
              
              return (
                <div key={sub.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{sub.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currencySymbol}{convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    {sub.currency !== displayCurrency && (
                      <p className="text-xs text-gray-400">{sub.currency} {sub.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
                    <p className="text-sm text-gray-500">{new Date(sub.nextBilling).toLocaleDateString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Subscription List */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Your Subscriptions</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Categories
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {subscriptions.map(sub => {
            const category = allCategories.find(c => c.id === sub.category)
            const convertedAmount = convertCurrencyService(sub.amount, sub.currency, displayCurrency, exchangeRates)
            const displaySymbol = SUBSCRIPTION_CURRENCIES.find(c => c.code === displayCurrency)?.symbol || displayCurrency
            const originalSymbol = SUBSCRIPTION_CURRENCIES.find(c => c.code === sub.currency)?.symbol || sub.currency
            
            return (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category?.icon || '📦'}</span>
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-sm text-gray-500">
                      Next: {new Date(sub.nextBilling).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{displaySymbol}{convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{getFrequencyLabel(sub.frequency)}</p>
                    {sub.currency !== displayCurrency && (
                      <p className="text-xs text-gray-400">{originalSymbol}{sub.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sub.currency}</p>
                    )}
                    {sub.autoRenew && (
                      <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle className="h-3 w-3" /> Auto-renews
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSub(sub)}
                      className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Edit subscription"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2.5 hover:bg-red-50 text-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Delete subscription"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Auto-Detected Subscriptions */}
      {detectedSubscriptions.length > 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-semibold mb-4">Potential Subscriptions Detected</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Based on your transaction history, we found these recurring payments.
          </p>
          <div className="space-y-2">
            {detectedSubscriptions.slice(0, 5).map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sub.category ? allCategories.find(c => c.id === sub.category)?.icon : '💳'}</span>
                  <span>{sub.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">~${Number(sub.amount || 0).toFixed(2)}/mo</span>
                  <button
                    onClick={() => {
                      setSubscriptions([...subscriptions, { ...sub, id: Date.now().toString() }])
                    }}
                    className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    aria-label="Add detected subscription"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Add/Edit Modal */}
      {(showAddModal || editingSub) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingSub ? 'Edit Subscription' : 'Add Subscription'}
            </h3>
            <SubscriptionForm
              subscription={editingSub}
              categories={allCategories}
              onSubmit={async (data) => {
                try {
                  setLoading(true)
                  if (editingSub) {
                    // Update existing
                    const response = await axios.put(`${API_URL}/api/subscriptions/${editingSub.id}`, data, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    const updated = response.data.subscription
                    setSubscriptions(subs => subs.map(s => s.id === editingSub.id ? {
                      id: updated.id,
                      name: updated.name,
                      amount: parseFloat(updated.amount),
                      currency: updated.currency,
                      frequency: updated.frequency,
                      nextBilling: updated.next_billing?.split('T')[0] || data.nextBilling,
                      category: updated.category,
                      autoRenew: updated.auto_renew ?? data.autoRenew
                    } : s))
                    setEditingSub(null)
                  } else {
                    // Create new
                    const response = await axios.post(`${API_URL}/api/subscriptions`, data, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    const created = response.data.subscription
                    setSubscriptions([...subscriptions, {
                      id: created.id,
                      name: created.name,
                      amount: parseFloat(created.amount),
                      currency: created.currency,
                      frequency: created.frequency,
                      nextBilling: created.next_billing?.split('T')[0] || data.nextBilling,
                      category: created.category,
                      autoRenew: created.auto_renew ?? data.autoRenew
                    }])
                    setShowAddModal(false)
                  }
                } catch (error) {
                  console.error('Failed to save subscription:', error)
                  alert('Failed to save subscription')
                } finally {
                  setLoading(false)
                }
              }}
              onCancel={() => {
                setShowAddModal(false)
                setEditingSub(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Add New Category */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="font-medium mb-3">Add New Category</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Icon (emoji)"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-20 px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center text-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                {/* Sub-categories */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sub-categories (optional):</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add sub-category"
                      value={newSubCatInput}
                      onChange={(e) => setNewSubCatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newSubCatInput.trim()) {
                          e.preventDefault()
                          setNewCategorySubCats([...newCategorySubCats, newSubCatInput.trim()])
                          setNewSubCatInput('')
                        }
                      }}
                      className="flex-1 px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newSubCatInput.trim()) {
                          setNewCategorySubCats([...newCategorySubCats, newSubCatInput.trim()])
                          setNewSubCatInput('')
                        }
                      }}
                      disabled={!newSubCatInput.trim()}
                      className="px-3 py-3 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
                      aria-label="Add sub-category"
                    >
                      Add
                    </button>
                  </div>
                  {newCategorySubCats.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newCategorySubCats.map((sub, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {sub}
                          <button
                            onClick={() => setNewCategorySubCats(newCategorySubCats.filter((_, i) => i !== idx))}
                            className="hover:text-blue-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      saveCustomCategory(newCategoryName, newCategoryIcon, newCategorySubCats)
                      setNewCategoryName('')
                      setNewCategoryIcon('📦')
                      setNewCategorySubCats([])
                    }
                  }}
                  disabled={!newCategoryName.trim()}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                >
                  Add Category
                </button>
              </div>
            </div>

            {/* Category List */}
            <div>
              <h4 className="font-medium mb-3">Default Categories</h4>
              <div className="space-y-2 mb-4">
                {DEFAULT_CATEGORIES.map(cat => (
                  <div key={cat.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">Default</span>
                    </div>
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div className="mt-2 pl-8 flex flex-wrap gap-1">
                        {cat.subCategories.map(sub => (
                          <span key={sub.id} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300">
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {customCategories.length > 0 && (
                <>
                  <h4 className="font-medium mb-3">Custom Categories</h4>
                  <div className="space-y-2">
                    {customCategories.map(cat => (
                      <CustomCategoryItem
                        key={cat.id}
                        category={cat}
                        onDelete={() => deleteCustomCategory(cat.id)}
                        onAddSubCat={(name) => addSubCategoryToCustom(cat.id, name)}
                        onDeleteSubCat={(subId) => deleteSubCategory(cat.id, subId)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Subscription Form Component
function SubscriptionForm({
  subscription,
  categories,
  onSubmit,
  onCancel
}: {
  subscription?: Subscription | null
  categories: Category[]
  onSubmit: (data: Omit<Subscription, 'id'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    amount: subscription?.amount || 0,
    currency: subscription?.currency || 'USD',
    frequency: subscription?.frequency || 'monthly',
    nextBilling: subscription?.nextBilling || new Date().toISOString().split('T')[0],
    category: subscription?.category || 'other',
    subCategory: subscription?.subCategory || '',
    autoRenew: subscription?.autoRenew ?? true,
  })

  // Get selected category's sub-categories
  const selectedCategory = categories.find(c => c.id === formData.category)
  const hasSubCategories = selectedCategory?.subCategories && selectedCategory.subCategories.length > 0

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          placeholder="Netflix, Spotify, etc."
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            {SUBSCRIPTION_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Frequency</label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
          className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
          className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>

      {/* Sub-category dropdown (if category has sub-categories) */}
      {hasSubCategories && (
        <div>
          <label className="block text-sm font-medium mb-1">Sub-Category</label>
          <select
            value={formData.subCategory}
            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
            className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="">Select sub-category...</option>
            {selectedCategory.subCategories!.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Next Billing Date</label>
        <input
          type="date"
          value={formData.nextBilling}
          onChange={(e) => setFormData({ ...formData, nextBilling: e.target.value })}
          className="w-full px-3 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoRenew"
          checked={formData.autoRenew}
          onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
          className="h-4 w-4"
        />
        <label htmlFor="autoRenew" className="text-sm">Auto-renews</label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium"
        >
          {subscription ? 'Save Changes' : 'Add Subscription'}
        </button>
      </div>
    </form>
  )
}

// Helper functions
function calculateNextBilling(transactions: any[]) {
  const sorted = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const lastDate = new Date(sorted[0].date)
  lastDate.setMonth(lastDate.getMonth() + 1)
  return lastDate.toISOString().split('T')[0]
}

function detectCategory(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('netflix') || lower.includes('hulu') || lower.includes('disney') || lower.includes('hbo')) return 'streaming'
  if (lower.includes('spotify') || lower.includes('apple music') || lower.includes('youtube')) return 'music'
  if (lower.includes('adobe') || lower.includes('microsoft') || lower.includes('notion')) return 'software'
  if (lower.includes('gym') || lower.includes('fitness')) return 'fitness'
  return 'other'
}

// Custom Category Item Component with sub-category management
function CustomCategoryItem({
  category,
  onDelete,
  onAddSubCat,
  onDeleteSubCat
}: {
  category: Category
  onDelete: () => void
  onAddSubCat: (name: string) => void
  onDeleteSubCat: (subId: string) => void
}) {
  const [newSubCat, setNewSubCat] = useState('')
  const [showAddSub, setShowAddSub] = useState(false)

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Delete category"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Sub-categories */}
      {(category.subCategories && category.subCategories.length > 0) && (
        <div className="mt-2 pl-8 flex flex-wrap gap-1">
          {category.subCategories.map(sub => (
            <span key={sub.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-200">
              {sub.name}
              <button
                onClick={() => onDeleteSubCat(sub.id)}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add sub-category */}
      {showAddSub ? (
        <div className="mt-2 pl-8 flex gap-2">
          <input
            type="text"
            placeholder="Sub-category name"
            value={newSubCat}
            onChange={(e) => setNewSubCat(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newSubCat.trim()) {
                onAddSubCat(newSubCat)
                setNewSubCat('')
                setShowAddSub(false)
              }
            }}
            className="flex-1 px-2 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => {
              if (newSubCat.trim()) {
                onAddSubCat(newSubCat)
                setNewSubCat('')
                setShowAddSub(false)
              }
            }}
            className="px-3 py-2 text-xs bg-primary-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            aria-label="Add sub-category"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddSub(false)}
            className="px-3 py-2 text-xs bg-gray-300 dark:bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSub(true)}
          className="mt-2 ml-8 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
          aria-label="Add sub-category"
        >
          + Add sub-category
        </button>
      )}
    </div>
  )
}