import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, PiggyBank, TrendingUp } from 'lucide-react'

export function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: List, label: 'Transactions' },
    { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
    { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
