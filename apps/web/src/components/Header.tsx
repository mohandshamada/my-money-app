import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Wallet, LogOut } from 'lucide-react'
import { RootState } from '../store'
import { logout } from '../store/authSlice'

export function Header() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                My Money
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                  Dashboard
                </Link>
                <Link to="/transactions" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                  Transactions
                </Link>
                <Link to="/budgets" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                  Budgets
                </Link>
                <Link to="/forecast" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                  Forecast
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.email}
              </span>
              <button
                onClick={() => dispatch(logout())}
                className="p-2 text-gray-600 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
