import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Menu, X, Home, List, PlusCircle, PieChart, Settings, LogOut, User } from 'lucide-react'
import { RootState } from '../store'
import { logout } from '../store/slices/authSlice'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header (hidden on mobile) */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile header with hamburger and user menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">My Money</h1>
        {/* User menu on mobile - moved here */}
        <MobileUserMenu />
      </div>
      
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
        <main className="flex-1 p-4 md:p-6 pt-16 lg:pt-6 w-full overflow-x-hidden pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  )
}

function MobileUserMenu() {
  const [showMenu, setShowMenu] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  const handleLogout = () => {
    localStorage.removeItem('token')
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <a href="/settings" className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Settings
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
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