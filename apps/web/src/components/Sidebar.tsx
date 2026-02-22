import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, PiggyBank, TrendingUp, Settings } from 'lucide-react'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: List, label: 'Transactions' },
    { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
    { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen lg:min-h-0">
      <nav className="p-4">
        {/* Logo for mobile sidebar */}
        <div className="lg:hidden mb-6 px-4">
          <h1 className="text-xl font-bold text-blue-600">My Money</h1>
        </div>

        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : ''
                    }`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-4 border-t dark:border-gray-700">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </aside>
  )
}