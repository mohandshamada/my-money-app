import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { RootState } from '../store'
import { useCurrency } from '../contexts/CurrencyContext'

interface CalendarItem {
  id: string
  label: string
  amount: number
  isExpense: boolean
  date: Date
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function BillCalendar() {
  const { transactions } = useSelector((state: RootState) => state.transactions)
  const { formatAmount } = useCurrency()
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = []
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)

    transactions.forEach((t) => {
      const d = new Date(t.date)
      if (d >= start && d <= end) {
        items.push({
          id: t.id,
          label: t.merchant || t.category,
          amount: t.amount,
          isExpense: t.isExpense,
          date: d,
        })
      }
    })
    return items
  }, [transactions, viewDate])

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
          const bills = dayItems.filter((i) => i.isExpense)
          const income = dayItems.filter((i) => !i.isExpense)
          const billTotal = bills.reduce((s, i) => s + i.amount, 0)
          const incomeTotal = income.reduce((s, i) => s + i.amount, 0)
          const isToday =
            day === new Date().getDate() &&
            viewDate.getMonth() === new Date().getMonth() &&
            viewDate.getFullYear() === new Date().getFullYear()

          return (
            <div
              key={day}
              className={`aspect-square min-h-[44px] sm:min-h-[70px] rounded-md sm:rounded-lg border p-0.5 sm:p-1 flex flex-col ${
                isToday
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">{day}</span>
              <div className="flex-1 overflow-hidden space-y-0.5 mt-0.5">
                {billTotal > 0 && (
                  <div className="text-[8px] sm:text-[10px] text-red-600 dark:text-red-400 font-medium truncate" title={`Bills: ${formatAmount(billTotal)}`}>
                    −{formatAmount(billTotal)}
                  </div>
                )}
                {incomeTotal > 0 && (
                  <div className="text-[8px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium truncate" title={`Income: ${formatAmount(incomeTotal)}`}>
                    +{formatAmount(incomeTotal)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t dark:border-gray-700 text-[10px] sm:text-xs">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" /> Bills
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" /> Income
        </span>
      </div>
    </div>
  )
}
