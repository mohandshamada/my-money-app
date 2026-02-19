import { useState } from 'react'
import { Bell, Lock, CreditCard, User, Globe, Palette } from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle'
import { useToast } from '../components/Toast'

export function SettingsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  const handleSave = () => {
    showToast('Settings saved successfully', 'success')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 card">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Profile Settings</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="you@example.com"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Default Currency</label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSave} className="btn-primary">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Appearance</h2>
              
              <div>
                <label className="block text-sm font-medium mb-3">Theme</label>
                <ThemeToggle />
              </div>

              <div className="pt-4 border-t dark:border-gray-700">
                <label className="block text-sm font-medium mb-3">Accent Color</label>
                <div className="flex gap-3">
                  {['blue', 'green', 'purple', 'orange', 'pink'].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full bg-${color}-500 ring-2 ring-offset-2 ring-transparent hover:ring-${color}-500`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <button onClick={handleSave} className="btn-primary">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Notifications</h2>
              
              {[
                { label: 'Budget alerts', desc: 'Get notified when approaching budget limits' },
                { label: 'Weekly summary', desc: 'Receive weekly financial summary emails' },
                { label: 'Large transactions', desc: 'Alert on transactions over $100' },
                { label: 'Forecast updates', desc: 'Notify when forecast significantly changes' },
              ].map((item) => (
                <label key={item.label} className="flex items-start gap-3 py-3 border-b dark:border-gray-700 last:border-0">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </label>
              ))}

              <button onClick={handleSave} className="btn-primary">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Security</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <button onClick={handleSave} className="btn-primary">
                Update Password
              </button>

              <div className="pt-6 border-t dark:border-gray-700">
                <h3 className="font-medium mb-2">Danger Zone</h3>
                <button 
                  className="text-red-600 hover:text-red-700 text-sm"
                  onClick={() => showToast('This feature is not implemented yet', 'info')}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Billing</h2>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
                <p className="text-2xl font-bold">Free</p>
                <p className="text-sm text-gray-500">50 transactions per month</p>
              </div>

              <a href="/billing" className="inline-block btn-primary">
                Upgrade to Pro
              </a>

              <div className="pt-6 border-t dark:border-gray-700">
                <h3 className="font-medium mb-4">Payment History</h3>
                <p className="text-gray-500">No payments yet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
