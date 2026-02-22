import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Menu, X, Home, List, PlusCircle, PieChart, Settings } from 'lucide-react'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <Header />
      
      <div className="flex">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pt-20 lg:pt-6 w-full overflow-x-hidden pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  )
}

function MobileNav() {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/transactions', icon: List, label: 'History' },
    { to: '/transactions?add=true', icon: PlusCircle, label: 'Add', isAdd: true },
    { to: '/budgets', icon: PieChart, label: 'Budgets' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 lg:hidden z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => {
              if (item.isAdd) {
                return 'flex flex-col items-center p-2'
              }
              return `flex flex-col items-center p-2 transition-colors duration-200 ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }`
            }}
          >
            {({ isActive }) => (
              <>
                {item.isAdd ? (
                  <div className="bg-blue-600 rounded-full p-3 -mt-6 shadow-lg">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <item.icon className={`h-6 w-6 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`} />
                )}
                <span className={`text-xs mt-1 transition-colors duration-200 ${
                  item.isAdd ? 'text-gray-600 dark:text-gray-300' :
                  isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : ''
                }`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}