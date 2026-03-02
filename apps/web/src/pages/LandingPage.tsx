import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Wallet, TrendingUp, Shield, CheckCircle,
  Menu, X, ArrowRight, PieChart, Bell, Lock, Smartphone,
  Globe, ChevronDown, Sparkles, Camera, Calendar,
  Target, TrendingDown, Brain, FileText,
  Award, BarChart3, Receipt, Landmark
} from 'lucide-react'

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'AI Tools', href: '#ai' },
    { name: 'Security', href: '#security' },
    { name: 'Pricing', href: '#pricing' },
  ]

  const features = [
    {
      icon: Wallet,
      title: 'Safe to Spend',
      description: 'Know exactly how much money you can safely spend after accounting for upcoming bills and budget allocations.',
      color: 'green'
    },
    {
      icon: Brain,
      title: 'AI Financial Assistant',
      description: 'Chat with our AI to get personalized financial advice, analyze your spending patterns, and discover savings opportunities.',
      color: 'purple'
    },
    {
      icon: Camera,
      title: 'Receipt Scanner',
      description: 'Snap a photo of any receipt and our AI will automatically extract merchant, amount, date, and categorize it.',
      color: 'blue'
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Get notified about overspending, unusual transactions, upcoming bills, and budget threshold breaches.',
      color: 'orange'
    },
    {
      icon: TrendingUp,
      title: 'Cash Flow Forecasting',
      description: 'See your projected cash flow days, weeks, or even years ahead with AI-powered predictions.',
      color: 'green'
    },
    {
      icon: BarChart3,
      title: 'Net Worth Tracker',
      description: 'Track your assets, liabilities, and net worth over time. Visualize your wealth-building journey.',
      color: 'indigo'
    },
    {
      icon: Calendar,
      title: 'Bill Calendar',
      description: 'Never miss a payment. Visual calendar shows all upcoming bills and recurring transactions.',
      color: 'red'
    },
    {
      icon: Target,
      title: 'Savings Goals',
      description: 'Set and track savings goals with visual progress indicators and smart recommendations.',
      color: 'pink'
    },
    {
      icon: TrendingDown,
      title: 'Debt Payoff Calculator',
      description: 'Create a personalized debt payoff plan. See how extra payments accelerate your freedom.',
      color: 'rose'
    },
    {
      icon: Award,
      title: 'Spending Streaks',
      description: 'Gamify your savings with streaks for staying under budget and hitting financial milestones.',
      color: 'yellow'
    },
    {
      icon: FileText,
      title: 'Statement Parser',
      description: 'Upload PDF bank statements and our AI extracts all transactions automatically. Supports multiple banks.',
      color: 'cyan'
    },
    {
      icon: PieChart,
      title: 'Visual Analytics',
      description: 'Beautiful Sankey diagrams, spending charts, and Year-over-Year comparisons make data actionable.',
      color: 'violet'
    }
  ]

  const aiFeatures = [
    {
      icon: Sparkles,
      title: 'AI-Powered Categorization',
      description: 'Automatic transaction categorization that learns from your patterns.'
    },
    {
      icon: Receipt,
      title: 'OCR Receipt Scanning',
      description: 'Extract data from receipt photos instantly with GLM-5 Vision AI.'
    },
    {
      icon: Brain,
      title: 'Conversational AI',
      description: 'Ask questions about your finances in natural language.'
    },
    {
      icon: FileText,
      title: 'PDF Statement Parsing',
      description: 'AI reads and extracts transactions from bank statements automatically.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">My Money</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900 dark:text-white" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block py-2 text-gray-600 dark:text-gray-300 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-3 border-t dark:border-gray-800 space-y-2">
                <Link
                  to="/login"
                  className="block py-2 text-gray-600 dark:text-gray-300 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Now with AI-Powered Receipt Scanning
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Your Money, <span className="text-blue-600">Smarter</span> With AI
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
                The all-in-one finance app with AI assistant, receipt scanning, cash flow forecasting, and intelligent budgeting. Take control of your financial future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Start Free Today
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Explore Features
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free forever plan
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Bank-level security
                </div>
              </div>
            </div>
            
            {/* Hero Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Safe to Spend</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">$2,450.00</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                      +12.5%
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {[
                      { name: 'Netflix', amount: '-$15.99', date: 'Today', icon: Smartphone, color: 'blue' },
                      { name: 'Grocery Store', amount: '-$124.32', date: 'Yesterday', icon: Globe, color: 'green' },
                      { name: 'Salary Deposit', amount: '+$3,500.00', date: 'Feb 25', icon: Landmark, color: 'purple' }
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${tx.color}-100 text-${tx.color}-600`}>
                            <tx.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{tx.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{tx.date}</p>
                          </div>
                        </div>
                        <span className={`font-medium ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                      <Brain className="h-4 w-4" />
                      <span>AI Insight: You're spending 15% less on dining out this month!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai" className="py-20 bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Powered by GLM-5 AI
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI That Understands Your Money
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From receipt scanning to conversational insights, our AI handles 
              the heavy lifting so you can focus on what matters.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Win With Money
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help you save more, spend wisely, 
              and build lasting wealth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="group p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-100 dark:bg-${feature.color}-900/30`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bank Sync */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Connect 12,000+ Banks
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Link your accounts securely via Plaid. Transactions sync automatically 
                so you always have an up-to-date view of your finances.
              </p>
              <div className="space-y-4">
                {[
                  'Automatic transaction syncing',
                  'Real-time balance updates',
                  'Secure bank-level encryption',
                  'No storage of bank credentials'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', 'Amex'].map((bank) => (
                <div key={bank} className="bg-white dark:bg-gray-800 p-4 rounded-xl text-center shadow-sm">
                  <Landmark className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{bank}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Security You Can Trust
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We use the same security measures as banks to protect your data. 
                From encryption to biometric authentication, your information is always safe.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, text: '256-bit AES encryption' },
                  { icon: Smartphone, text: 'Passkey & biometric auth' },
                  { icon: Shield, text: 'Two-factor authentication' },
                  { icon: FileText, text: 'GDPR & CCPA compliant' }
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '256-bit', label: 'Encryption' },
                { value: '12K+', label: 'Banks Supported' },
                { value: '2FA', label: 'Enabled' },
                { value: 'SOC 2', label: 'Ready' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center shadow-sm">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</p>
                  <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                name: 'Free', 
                price: '$0', 
                period: 'forever',
                features: [
                  '100 transactions/month',
                  'CSV import/export',
                  'Basic budgeting',
                  'Manual entry only',
                  'Email support'
                ],
                cta: 'Get Started', 
                ctaLink: '/register' 
              },
              { 
                name: 'Standard', 
                price: '$9', 
                period: '/month',
                features: [
                  '1,000 transactions/month',
                  'PDF statement upload',
                  'Bank sync via Plaid',
                  'Cash flow forecasting',
                  'Priority support'
                ],
                popular: true, 
                cta: 'Start Free Trial', 
                ctaLink: '/register' 
              },
              { 
                name: 'Premium', 
                price: '$29', 
                period: '/month',
                features: [
                  '10,000 transactions/month',
                  'AI receipt scanning',
                  'AI-powered categorization',
                  'Smart categorization',
                  'Everything in Standard'
                ],
                cta: 'Go Premium', 
                ctaLink: '/register' 
              }
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-4 dark:ring-offset-gray-900' 
                  : 'bg-white dark:bg-gray-800 border dark:border-gray-700'
              }`}>
                {plan.popular && (
                  <span className="inline-block bg-white/20 text-white text-sm px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
                    {plan.period}
                  </span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-blue-50' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to={plan.ctaLink}
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is My Money really free?',
                a: 'Yes! Our free plan includes up to 100 transactions per month, basic budgeting, and CSV import/export. Upgrade to Standard or Premium for more advanced features like bank sync and AI capabilities.'
              },
              {
                q: 'How secure is my data?',
                a: 'We use 256-bit AES encryption, the same standard banks use. Your data is encrypted at rest and in transit. We support Passkeys and 2FA, and we never sell your data.'
              },
              {
                q: 'What banks are supported?',
                a: 'We support over 12,000 financial institutions in the US, Canada, UK, and Europe through our integration with Plaid.'
              },
              {
                q: 'How does the Receipt Scanner work?',
                a: 'Using advanced GLM-5 Vision AI, you just snap a photo of any receipt and our system automatically extracts the merchant name, total amount, date, and categorizes the expense for you.'
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                  <ChevronDown className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">My Money</span>
              </div>
              <p className="text-sm">AI-powered personal finance for modern life.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#security" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2026 My Money. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
