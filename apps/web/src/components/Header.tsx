import { useState, useEffect } from 'react'
import { LogOut, User, ChevronDown, Crown } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { logout } from '../store/authSlice'

export function Header() {
  const [showMenu, setShowMenu] = useState(false)
  const [userTier, setUserTier] = useState<string>('free')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch('/api/settings/tier', {
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
    navigate('/login')
  }

  const tierColors: Record<string, string> = {
    premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            My Money
          </h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={showMenu ? "Close user menu" : "Open user menu"}
            aria-expanded={showMenu}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-[150px]">
                {user?.fullName || user?.email || 'User'}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${tierColors[userTier]}`}>
                {userTier === 'premium' && <Crown className="inline h-3 w-3 mr-0.5" />}
                {userTier}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20">
                <div className="px-4 py-3 border-b dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierColors[userTier]}`}>
                    {userTier === 'premium' && <Crown className="h-3 w-3" />}
                    {userTier} Plan
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
