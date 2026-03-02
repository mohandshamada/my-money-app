import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Repeat, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { RootState } from '../store'
import { useCurrency } from '../contexts/CurrencyContext'

interface CalendarItem {
  id: string
  label: string
  amount: number
  type: 'bill' | 'subscription' | 'income'
  date: Date
}

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'yearly' | 'weekly'
  nextBillingDate: string
  category?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function BillCalendar() {
  const { transactions } = useSelector((state: RootState) => state.transactions)
  const { formatAmount } = useCurrency()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch('/api/subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setSubscriptions(data.subscriptions || [])
        }
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err)
      }
    }
    fetchSubscriptions()
  }, [])

  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = []
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)

    // Add transactions
    transactions.forEach((t) => {
      const d = new Date(t.date)
      if (d >= start && d <= end) {
        const isExpense = !!(t.isExpense || (t as any).is_expense)
        const isRecurring = t.isRecurring || t.category?.toLowerCase().includes('subscription')
        
        items.push({
          id: t.id,
          label: t.merchant || t.category,
          amount: Number(t.amount) || 0,
          type: isRecurring ? 'subscription' : (isExpense ? 'bill' : 'income'),
          date: d,
        })
      }
    })

    // Add subscriptions for current month
    subscriptions.forEach((sub) => {
      const nextDate = new Date(sub.nextBillingDate)
      if (nextDate >= start && nextDate <= end) {
        items.push({
          id: `sub-${sub.id}`,
          label: sub.name,
          amount: Number(sub.amount) || 0,
          type: 'subscription',
          date: nextDate,
        })
      }

      // For monthly subscriptions, also show them on the same day each month
      if (sub.frequency === 'monthly') {
        const billingDay = nextDate.getDate()
        if (billingDay >= 1 && billingDay <= end.getDate()) {
          const subDate = new Date(year, month, billingDay)
          // Only add if not already added from nextBillingDate
          if (subDate.getTime() !== nextDate.getTime()) {
            items.push({
              id: `sub-monthly-${sub.id}-${billingDay}`,
              label: sub.name,
              amount: Number(sub.amount) || 0,
              type: 'subscription',
              date: subDate,
            })
          }
        }
      }
    })

    return items
  }, [transactions, subscriptions, viewDate])

  const { days, startOffset } = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startOffset = first.getDay()
    const totalDays = last.getDate()
    const days = Array.from({ length: totalDays }, (_, i) => i + 1)
    return { days, startOffset }
  }, [viewDate])

  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalendarItem[]>()
    calendarItems.forEach((item) => {
      const day = item.date.getDate()
      const list = map.get(day) || []
      list.push(item)
      map.set(day, list)
    })
    return map
  }, [calendarItems])

  const monthlyTotals = useMemo(() => {
    let bills = 0
    let subscriptions = 0
    let income = 0

    calendarItems.forEach((item) => {
      if (item.type === 'bill') bills += item.amount
      else if (item.type === 'subscription') subscriptions += item.amount
      else if (item.type === 'income') income += item.amount
    })

    return { bills, subscriptions, income, total: bills + subscriptions }
  }, [calendarItems])

  const prevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          Bill Calendar
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <span className="text-sm sm:text-base font-medium min-w-[100px] sm:min-w-[140px] text-center truncate">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <ArrowUpRight className="h-3 w-3" />
            <span className="text-[10px] sm:text-xs font-medium">Bills</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatAmount(monthlyTotals.bills)}</p>
        </div>
        <div className="text-center border-x dark:border-gray-700">
          <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
            <Repeat className="h-3 w-3" />
            <span className="text-[10px] sm:text-xs font-medium">Subscriptions</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatAmount(monthlyTotals.subscriptions)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <ArrowDownLeft className="h-3 w-3" />
            <span className="text-[10px] sm:text-xs font-medium">Income</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatAmount(monthlyTotals.income)}</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d.slice(0, 3)}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: startOffset }, (_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dayItems = itemsByDay.get(day) || []
          const bills = dayItems.filter((i) => i.type === 'bill')
          const subscriptions = dayItems.filter((i) => i.type === 'subscription')
          const income = dayItems.filter((i) => i.type === 'income')
          
          const billTotal = bills.reduce((s, i) => s + i.amount, 0)
          const subTotal = subscriptions.reduce((s, i) => s + i.amount, 0)
          const incomeTotal = income.reduce((s, i) => s + i.amount, 0)
          
          const isToday =
            day === new Date().getDate() &&
            viewDate.getMonth() === new Date().getMonth() &&
            viewDate.getFullYear() === new Date().getFullYear()

          const hasItems = dayItems.length > 0

          return (
            <div
              key={day}
              className={`aspect-square min-h-[50px] sm:min-h-[80px] rounded-md sm:rounded-lg border p-0.5 sm:p-1 flex flex-col ${
                isToday
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : hasItems
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-xs font-medium ${
                  isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {day}
                </span>
                {hasItems && (
                  <div className="flex gap-0.5">
                    {bills.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {subscriptions.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                    {income.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden space-y-0.5 mt-0.5">
                {billTotal > 0 && (
                  <div className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-red-600 dark:text-red-400 font-medium truncate">
                    <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{formatAmount(billTotal)}</span>
                  </div>
                )}
                {subTotal > 0 && (
                  <div className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate">
                    <Repeat className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{formatAmount(subTotal)}</span>
                  </div>
                )}
                {incomeTotal > 0 && (
                  <div className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium truncate">
                    <ArrowDownLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{formatAmount(incomeTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t dark:border-gray-700 text-[10px] sm:text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Bills</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Subscriptions</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Income</span>
        </span>
      </div>

      {/* Upcoming Items List */}
      {calendarItems.length > 0 && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upcoming This Month</h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {calendarItems
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {item.type === 'bill' && <ArrowUpRight className="h-4 w-4 text-red-500" />}
                    {item.type === 'subscription' && <Repeat className="h-4 w-4 text-purple-500" />}
                    {item.type === 'income' && <ArrowDownLeft className="h-4 w-4 text-green-500" />}
                    <span className="text-sm text-gray-900 dark:text-white">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      item.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
                    </span>
                    <span className="text-xs text-gray-500">{item.date.getDate()}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
