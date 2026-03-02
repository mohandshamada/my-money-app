import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Building, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Asset {
  id: string;
  name: string;
  category: 'bank' | 'investment' | 'property' | 'other';
  amount: number;
  change: number;
}

interface Liability {
  id: string;
  name: string;
  category: 'credit_card' | 'loan' | 'mortgage' | 'other';
  amount: number;
  change: number;
}

interface HistoricalData {
  month: string;
  netWorth: number;
}

// Mock data for demonstration
const mockHistoricalData: HistoricalData[] = [
  { month: 'Sep', netWorth: 65000 },
  { month: 'Oct', netWorth: 70500 },
  { month: 'Nov', netWorth: 78000 },
  { month: 'Dec', netWorth: 76800 },
  { month: 'Jan', netWorth: 92500 },
  { month: 'Feb', netWorth: 100200 },
];

const mockAssets: Asset[] = [
  { id: '1', name: 'Main Checking', category: 'bank', amount: 12500, change: 1200 },
  { id: '2', name: 'Savings Account', category: 'bank', amount: 25000, change: 500 },
  { id: '3', name: 'Investment Portfolio', category: 'investment', amount: 65000, change: 4500 },
  { id: '4', name: 'Home Equity', category: 'property', amount: 31000, change: 0 },
];

const mockLiabilities: Liability[] = [
  { id: 'l1', name: 'Travel Credit Card', category: 'credit_card', amount: 2400, change: 450 },
  { id: 'l2', name: 'Car Loan', category: 'loan', amount: 14500, change: -400 },
  { id: 'l3', name: 'Student Loan', category: 'loan', amount: 16400, change: -350 },
];

export const NetWorthDashboard: React.FC = () => {
  const totalAssets = useMemo(() => mockAssets.reduce((sum, a) => sum + a.amount, 0), []);
  const totalLiabilities = useMemo(() => mockLiabilities.reduce((sum, l) => sum + l.amount, 0), []);
  const netWorth = totalAssets - totalLiabilities;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const assetCategories = [
    { name: 'Cash', icon: PiggyBank, color: 'text-blue-600', bgColor: 'bg-blue-100', amount: mockAssets.filter(a => a.category === 'bank').reduce((sum, a) => sum + a.amount, 0) },
    { name: 'Investments', icon: TrendingUp, color: 'text-indigo-600', bgColor: 'bg-indigo-100', amount: mockAssets.filter(a => a.category === 'investment').reduce((sum, a) => sum + a.amount, 0) },
    { name: 'Property', icon: Building, color: 'text-emerald-600', bgColor: 'bg-emerald-100', amount: mockAssets.filter(a => a.category === 'property').reduce((sum, a) => sum + a.amount, 0) },
  ];

  const liabilityCategories = [
    { name: 'Credit Cards', icon: CreditCard, color: 'text-red-600', bgColor: 'bg-red-100', amount: mockLiabilities.filter(l => l.category === 'credit_card').reduce((sum, l) => sum + l.amount, 0) },
    { name: 'Loans', icon: Wallet, color: 'text-orange-600', bgColor: 'bg-orange-100', amount: mockLiabilities.filter(l => l.category === 'loan').reduce((sum, l) => sum + l.amount, 0) },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Net Worth</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assets Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Assets</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAssets)}</p>
          <p className="text-sm text-green-600 mt-1">+5.2% this month</p>
        </div>

        {/* Liabilities Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Liabilities</span>
            </div>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalLiabilities)}</p>
          <p className="text-sm text-green-600 mt-1">-2.1% this month</p>
        </div>

        {/* Net Worth Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/80">Net Worth</span>
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
          <p className="text-sm text-white/80 mt-1">+12.4% all time</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth History</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockHistoricalData}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="netWorth" stroke="#6366f1" fillOpacity={1} fill="url(#colorNetWorth)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assetCategories.map((category) => (
            <div key={category.name} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
              <div className={`p-3 rounded-lg ${category.bgColor}`}>
                <category.icon className={`h-5 w-5 ${category.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{category.name}</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(category.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liability Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liabilities by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liabilityCategories.map((category) => (
            <div key={category.name} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
              <div className={`p-3 rounded-lg ${category.bgColor}`}>
                <category.icon className={`h-5 w-5 ${category.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{category.name}</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(category.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetWorthDashboard;