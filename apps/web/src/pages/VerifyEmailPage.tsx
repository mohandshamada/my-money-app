import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (token && email) {
      verifyEmail()
    } else {
      setStatus('error')
      setMessage('Invalid verification link')
    }
  }, [token, email])

  const verifyEmail = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-email/confirm`, {
        token,
        email
      })
      
      setStatus('success')
      setMessage(res.data.message || 'Email verified successfully!')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.response?.data?.error || 'Failed to verify email')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold mb-2">Verifying Email</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2 text-green-800">Email Verified!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold mb-2 text-red-800">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Component for resending verification email
export function EmailVerificationBanner({ email, isVerified, onResend }: { 
  email: string
  isVerified: boolean
  onResend?: () => void 
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (isVerified) return null

  const handleResend = async () => {
    setSending(true)
    setError('')
    
    try {
      await axios.post(`${API_URL}/api/auth/verify-email/send`, { email })
      setSent(true)
      onResend?.()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-yellow-800 font-medium">
            Please verify your email address
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            We've sent a verification link to {email}. Check your inbox and spam folder.
          </p>
          
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
          
          {sent ? (
            <p className="text-xs text-green-600 mt-2">✓ Verification email sent!</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={sending}
              className="text-xs text-yellow-800 underline mt-2 hover:no-underline disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Resend verification email'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}