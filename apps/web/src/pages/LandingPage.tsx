import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, Shield, Download } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <!-- Hero Section -->
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Take Control of Your
            <span className="text-primary-600"> Financial Future</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            CashFlow combines simple budgeting with powerful cash flow forecasting.
            See where your money is going and where it will be.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Why Choose CashFlow?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Wallet,
              title: 'Smart Budgeting',
              description: 'Flexible budgets that adapt to your lifestyle'
            },
            {
              icon: TrendingUp,
              title: 'Cash Flow Forecasting',
              description: 'See your financial future up to 30 years ahead'
            },
            {
              icon: Shield,
              title: 'Bank-Level Security',
              description: 'Your data is encrypted and never sold'
            },
            {
              icon: Download,
              title: 'Easy Data Export',
              description: 'Take your data anytime in standard formats'
            }
          ].map((feature) => (
            <div key={feature.title} className="card text-center">
              <feature.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <!-- Pricing -->
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { name: 'Free', price: '$0', features: ['CSV import', 'Basic budgeting', '50 transactions/mo'] },
            { name: 'Pro', price: '$9/mo', features: ['Unlimited bank sync', 'Forecasting', 'All features'], popular: true },
            { name: 'Premium', price: '$15/mo', features: ['Investments', 'Multi-user', 'Advanced reports'] }
          ].map((plan) => (
            <div key={plan.name} className={`card ${plan.popular ? 'ring-2 ring-primary-600' : ''}`}>
              {plan.popular && (
                <span className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full">Popular</span>
              )}
              <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
              <p className="text-3xl font-bold text-primary-600 my-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
