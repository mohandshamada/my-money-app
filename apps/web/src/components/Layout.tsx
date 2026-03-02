import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { AIHub, AIFab } from './AIHub'
import { Menu, X, Home, List, PlusCircle, PieChart, Settings, LogOut, User, Crown } from 'lucide-react'
import { RootState } from '../store'
import { logout } from '../store/authSlice'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiHubOpen, setAiHubOpen] = useState(false)

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
          className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
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
        <main className="flex-1 p-4 md:p-6 pt-16 lg:pt-6 w-full overflow-x-hidden pb-24 sm:pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Floating AI Button - Visible on all pages */}
      <AIFab onClick={() => setAiHubOpen(true)} />

      {/* AI Hub Modal */}
      {aiHubOpen && <AIHub onClose={() => setAiHubOpen(false)} />}
    </div>
  )
}

function MobileUserMenu() {
  const API_URL = import.meta.env.VITE_API_URL || ''
  const [showMenu, setShowMenu] = useState(false)
  const [userTier, setUserTier] = useState('free')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_URL}/api/settings/tier`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserTier(data.tier || 'free')
        }
      } catch (err) {
        console.error('Failed to fetch tier:', err)
      }
    }
    fetchTier()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    dispatch(logout())
    navigate('/')
  }

  const tierColors: Record<string, string> = {
    premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label={showMenu ? "Close user menu" : "Open user menu"}
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
          <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20 max-w-xs">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierColors[userTier]}`}>
                {userTier === 'premium' && <Crown className="h-3 w-3" />}
                {userTier} Plan
              </span>
            </div>
            <a href="/settings" className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
              Settings
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function MobileNav() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const getAddAction = () => {
    const path = location.pathname
    
    if (path.includes('/subscriptions')) {
      return { label: 'Add Subscription', action: () => navigate('/subscriptions?add=true') }
    } else if (path.includes('/budgets')) {
      return { label: 'Add Budget', action: () => navigate('/budgets?add=true') }
    } else if (path.includes('/transactions') || path.includes('/dashboard')) {
      return { label: 'Add Transaction', action: () => navigate('/transactions?add=true') }
    } else {
      return { label: 'Add', action: () => navigate('/transactions?add=true') }
    }
  }

  const addAction = getAddAction()

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/transactions', icon: List, label: 'History' },
    { to: '/budgets', icon: PieChart, label: 'Budgets' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav 
      className={`
        fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 lg:hidden z-50
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <div className="flex justify-around py-1 items-end">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center p-3 sm:p-4 transition-colors duration-200 touch-target ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-6 w-6 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`} />
                <span className={`text-xs mt-1 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : ''
                }`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={addAction.action}
          className="flex flex-col items-center p-3 sm:p-4 touch-target -mt-4"
          aria-label={addAction.label}
        >
          <div className="bg-blue-600 rounded-full p-3 shadow-lg focus-ring" role="img" aria-label={addAction.label}>
            <PlusCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">Add</span>
        </button>

        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center p-3 sm:p-4 transition-colors duration-200 touch-target ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-6 w-6 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`} />
                <span className={`text-xs mt-1 transition-colors duration-200 ${
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
