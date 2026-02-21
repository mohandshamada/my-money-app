import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Wallet } from 'lucide-react'

export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      // Handle OAuth error
      navigate('/login?error=' + encodeURIComponent(error))
      return
    }

    if (token) {
      // Store token and redirect
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } else {
      // No token received
      navigate('/login?error=oauth_failed')
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Wallet className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Completing sign in...</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we authenticate you.
        </p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    </div>
  )
}