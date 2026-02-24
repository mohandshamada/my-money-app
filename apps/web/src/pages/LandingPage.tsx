import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Wallet, TrendingUp, Shield, CheckCircle, Star, 
  Menu, X, ArrowRight, PieChart, Bell, Lock, Smartphone,
  Globe, Zap, ChevronDown
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
    { name: 'Pricing', href: '#pricing' },
    { name: 'Security', href: '#security' },
    { name: 'FAQ', href: '#faq' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">My Money</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
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
                  className="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-medium"
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Trusted by 10,000+ users worldwide
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Take Control of Your{' '}
                <span className="text-primary-600">Financial Future</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
                My Money combines AI-powered insights with bank-level security. 
                Track spending, forecast cash flow, and build wealth—all in one app.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  See How It Works
                </a>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free forever plan
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Safe to Spend</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">$2,450.00</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                    +12.5%
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          i === 1 ? 'bg-blue-100 text-blue-600' : 
                          i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {i === 1 ? <Smartphone className="h-5 w-5" /> : 
                           i === 2 ? <Zap className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {i === 1 ? 'Netflix Subscription' : i === 2 ? 'Electric Bill' : 'Grocery Store'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {i === 1 ? 'Today' : i === 2 ? 'Yesterday' : 'Feb 22'}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {i === 1 ? '-$15.99' : i === 2 ? '-$89.50' : '-$124.32'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos/Trust */}
      <section className="py-12 border-y dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            Featured in leading publications
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
            {['TechCrunch', 'Forbes', 'Wired', 'The Verge', 'Product Hunt'].map((name) => (
              <span key={name} className="text-xl font-bold text-gray-400 dark:text-gray-600">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Master Your Money
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help you save more, spend wisely, and build wealth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Wallet,
                title: 'Smart Budgeting',
                description: 'AI-powered budgets that adapt to your spending patterns and lifestyle.',
                color: 'blue'
              },
              {
                icon: TrendingUp,
                title: 'Cash Flow Forecasting',
                description: 'See your financial future up to 30 years ahead with predictive analytics.',
                color: 'green'
              },
              {
                icon: Shield,
                title: 'Bank-Level Security',
                description: '256-bit encryption, passkeys, and 2FA keep your data safe and private.',
                color: 'purple'
              },
              {
                icon: PieChart,
                title: 'Visual Analytics',
                description: 'Beautiful charts and insights that make understanding your finances easy.',
                color: 'orange'
              },
              {
                icon: Bell,
                title: 'Smart Alerts',
                description: 'Get notified about unusual spending, upcoming bills, and savings opportunities.',
                color: 'red'
              },
              {
                icon: Lock,
                title: 'Privacy First',
                description: 'Your data is encrypted and never sold. You own your financial information.',
                color: 'indigo'
              }
            ].map((feature) => (
              <div key={feature.title} className="group p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-100 dark:bg-${feature.color}-900/30`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Your Security Is Our Priority
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We use the same security measures as banks to protect your data. 
                From encryption to passkeys, your information is always safe.
              </p>
              <div className="space-y-4">
                {[
                  '256-bit AES encryption at rest and in transit',
                  'Passkey and biometric authentication support',
                  'SOC 2 Type II certified data centers',
                  'Regular third-party security audits',
                  'GDPR and CCPA compliant'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '256-bit', label: 'Encryption' },
                { value: '99.9%', label: 'Uptime' },
                { value: 'SOC 2', label: 'Certified' },
                { value: 'GDPR', label: 'Compliant' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center">
                  <p className="text-3xl font-bold text-primary-600 mb-1">{stat.value}</p>
                  <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
                features: ['Up to 50 transactions/mo', 'Basic budgeting', 'CSV import/export', 'Email support'],
                cta: 'Get Started', 
                ctaLink: '/register' 
              },
              { 
                name: 'Pro', 
                price: '$9', 
                period: '/month',
                features: ['Unlimited transactions', 'Bank account sync', 'AI forecasting', 'Priority support', 'Receipt OCR'],
                popular: true, 
                cta: 'Start Free Trial', 
                ctaLink: '/register' 
              },
              { 
                name: 'Premium', 
                price: '$15', 
                period: '/month',
                features: ['Everything in Pro', 'Investment tracking', 'Multi-user access', 'Advanced reports', 'Custom integrations'],
                cta: 'Contact Sales', 
                ctaLink: 'mailto:sales@mymoney.mshousha.uk' 
              }
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-primary-600 text-white ring-4 ring-primary-600 ring-offset-4 dark:ring-offset-gray-900' 
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
                  <span className={plan.popular ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-primary-200' : 'text-primary-600'}`} />
                      <span className={plan.popular ? 'text-primary-50' : 'text-gray-600 dark:text-gray-300'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                {plan.ctaLink.startsWith('mailto') ? (
                  <a
                    href={plan.ctaLink}
                    className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors ${
                      plan.popular
                        ? 'bg-white text-primary-600 hover:bg-gray-100'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to={plan.ctaLink}
                    className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors ${
                      plan.popular
                        ? 'bg-white text-primary-600 hover:bg-gray-100'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is My Money really free?',
                a: 'Yes! Our free plan includes up to 50 transactions per month, basic budgeting, and CSV import/export. Upgrade to Pro for unlimited transactions and bank sync.'
              },
              {
                q: 'How secure is my data?',
                a: 'We use 256-bit AES encryption, the same standard banks use. Your data is encrypted at rest and in transit. We never sell your data to third parties.'
              },
              {
                q: 'Can I export my data?',
                a: 'Absolutely. You can export all your data anytime in CSV format. Your data belongs to you.'
              },
              {
                q: 'Does it work on mobile?',
                a: 'Yes! My Money is fully responsive and works great on iOS and Android. You can also add it to your home screen for a native app experience.'
              },
              {
                q: 'What banks are supported?',
                a: 'We support over 12,000 financial institutions through Plaid. If your bank isn\'t supported, you can always import transactions via CSV.'
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-gray-800 rounded-xl">
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

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join 10,000+ users who are already building wealth with My Money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">My Money</span>
              </div>
              <p className="text-sm">
                Intelligent personal finance for modern life.
              </p>
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
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
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
