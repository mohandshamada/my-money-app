import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface ForecastChartProps {
  data: Array<{
    date: string
    projectedBalance: number
    confidenceLow68: number
    confidenceHigh68: number
    confidenceLow95: number
    confidenceHigh95: number
  }>
}

export function ForecastChart({ data }: ForecastChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">No forecast data available</p>
      </div>
    )
  }

  const chartHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 250 : 300

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${((value || 0) / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          formatter={(value: number) => [`$${Number(value || 0).toFixed(2)}`, 'Balance']}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Area
          type="monotone"
          dataKey="projectedBalance"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorBalance)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface SpendingChartProps {
  data: Array<{
    category: string
    amount: number
  }>
}

export function SpendingChart({ data }: SpendingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">No spending data available</p>
      </div>
    )
  }

  const chartHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 250 : 300

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(value: number) => [`$${Number(value || 0).toFixed(2)}`, 'Spent']} />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface BalanceHistoryProps {
  data: Array<{
    date: string
    balance: number
  }>
}

export function BalanceHistoryChart({ data }: BalanceHistoryProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 sm:h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">No balance history</p>
      </div>
    )
  }

  const chartHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 160 : 200

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${((v || 0)/1000).toFixed(0)}k`} />
        <Tooltip formatter={(value: number) => [`$${Number(value || 0).toFixed(2)}`, 'Balance']} />
        <Area type="monotone" dataKey="balance" stroke="#10b981" fill="url(#colorHistory)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
