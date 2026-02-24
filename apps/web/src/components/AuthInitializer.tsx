import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { restoreSession, logout, setLoading } from '../store/authSlice'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        dispatch(setLoading(false))
        setIsReady(true)
        return
      }

      try {
        // Validate token by fetching user info
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.user) {
          // Token is valid, restore session
          dispatch(restoreSession({
            user: response.data.user,
            token: token
          }))
        }
      } catch (error) {
        // Token is invalid, clear it
        console.error('Token validation failed:', error)
        dispatch(logout())
        localStorage.removeItem('token')
      } finally {
        setIsReady(true)
      }
    }

    validateToken()
  }, [dispatch])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
