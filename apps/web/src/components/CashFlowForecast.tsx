import React, { useMemo, useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertTriangle,
  Wallet,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';

interface ForecastData {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  projectedSavings: number;
}

interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  monthlyImpact: number;
  annualSavings: number;
}

// Mock forecast data
const mockForecastData: ForecastData[] = [
  { month: 'Mar', projectedIncome: 5200, projectedExpenses: 4100, projectedBalance: 1100, projectedSavings: 800 },
  { month: 'Apr', projectedIncome: 5200, projectedExpenses: 4350, projectedBalance: 850, projectedSavings: 650 },
  { month: 'May', projectedIncome: 5200, projectedExpenses: 3900, projectedBalance: 1300, projectedSavings: 900 },
  { month: 'Jun', projectedIncome: 5200, projectedExpenses: 4200, projectedBalance: 1000, projectedSavings: 750 },
  { month: 'Jul', projectedIncome: 5200, projectedExpenses: 4600, projectedBalance: 600, projectedSavings: 400 },
  { month: 'Aug', projectedIncome: 5200, projectedExpenses: 3800, projectedBalance: 1400, projectedSavings: 950 },
];

// What-if scenarios
const whatIfScenarios: WhatIfScenario[] = [
  { id: '1', name: 'Reduce Dining Out', description: 'Cut restaurant spending by $200/month', monthlyImpact: 200, annualSavings: 2400 },
  { id: '2', name: 'Cancel Unused Subscriptions', description: 'Remove 3 unused streaming services', monthlyImpact: 45, annualSavings: 540 },
  { id: '3', name: 'Switch Phone Plan', description: 'Move to cheaper carrier', monthlyImpact: 30, annualSavings: 360 },
  { id: '4', name: 'DIY Coffee', description: 'Make coffee at home instead of buying', monthlyImpact: 150, annualSavings: 1800 },
];

// Upcoming bills
const upcomingBills = [
  { name: 'Rent', amount: 1800, date: 'Mar 1', type: 'fixed' },
  { name: 'Utilities', amount: 150, date: 'Mar 5', type: 'variable' },
  { name: 'Car Insurance', amount: 120, date: 'Mar 10', type: 'fixed' },
  { name: 'Phone Bill', amount: 85, date: 'Mar 12', type: 'fixed' },
  { name: 'Netflix', amount: 16, date: 'Mar 15', type: 'subscription' },
];

export const CashFlowForecast: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const totalIncome = useMemo(() => mockForecastData.reduce((sum, d) => sum + d.projectedIncome, 0), []);
  const totalExpenses = useMemo(() => mockForecastData.reduce((sum, d) => sum + d.projectedExpenses, 0), []);
  const totalSavings = useMemo(() => mockForecastData.reduce((sum, d) => sum + d.projectedSavings, 0), []);
  const avgMonthlyBalance = useMemo(() => totalIncome / 6 - totalExpenses / 6, [totalIncome, totalExpenses]);

  // Check for low balance months
  const lowBalanceMonths = mockForecastData.filter(d => d.projectedBalance < 800);

  // Apply what-if scenario
  const adjustedData = useMemo(() => {
    if (!selectedScenario) return mockForecastData;
    const scenario = whatIfScenarios.find(s => s.id === selectedScenario);
    if (!scenario) return mockForecastData;
    
    return mockForecastData.map(d => ({
      ...d,
      projectedExpenses: d.projectedExpenses - scenario.monthlyImpact,
      projectedBalance: d.projectedBalance + scenario.monthlyImpact,
      projectedSavings: d.projectedSavings + scenario.monthlyImpact,
    }));
  }, [selectedScenario]);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Flow Forecast</h1>
          <p className="text-sm text-gray-500">6-month projection based on your spending patterns</p>
        </div>
      </div>

      {/* Alert Banner */}
      {lowBalanceMonths.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Low Balance Warning</p>
            <p className="text-sm text-amber-700">
              {lowBalanceMonths.length} month(s) projected below $800 buffer: {lowBalanceMonths.map(m => m.month).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">6mo Income</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-sm text-gray-600">6mo Expenses</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-600">6mo Savings</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSavings)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-600">Avg Balance</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(avgMonthlyBalance)}</p>
        </div>
      </div>

      {/* Projected Balance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projected Balance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={adjustedData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <ReferenceLine y={800} stroke="#f59e0b" strokeDasharray="3 3" label="Min Buffer" />
              <Area type="monotone" dataKey="projectedBalance" stroke="#6366f1" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adjustedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="projectedIncome" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projectedExpenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What-If Scenarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setShowScenarios(!showScenarios)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">What-If Scenarios</h3>
              <p className="text-sm text-gray-500">See how small changes affect your forecast</p>
            </div>
          </div>
          {showScenarios ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>
        
        {showScenarios && (
          <div className="p-4 pt-0 border-t">
            <div className="space-y-3 mt-4">
              {whatIfScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(selectedScenario === scenario.id ? null : scenario.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    selectedScenario === scenario.id 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{scenario.name}</p>
                    <p className="text-sm text-gray-500">{scenario.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+{formatCurrency(scenario.monthlyImpact)}/mo</p>
                    <p className="text-xs text-gray-500">{formatCurrency(scenario.annualSavings)}/year</p>
                  </div>
                </button>
              ))}
            </div>
            {selectedScenario && (
              <p className="text-sm text-yellow-700 mt-3 text-center">
                Scenario applied! Charts above show adjusted projections.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Bills</h3>
        </div>
        <div className="space-y-3">
          {upcomingBills.map((bill, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  bill.type === 'fixed' ? 'bg-blue-500' : 
                  bill.type === 'subscription' ? 'bg-purple-500' : 'bg-orange-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{bill.name}</p>
                  <p className="text-xs text-gray-500">{bill.date} • {bill.type}</p>
                </div>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(bill.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashFlowForecast;