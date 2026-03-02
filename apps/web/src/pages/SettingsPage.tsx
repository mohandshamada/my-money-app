import { CurrencySelector } from '../components/CurrencySelector'
import { BankConnect } from '../components/BankConnect'
import { AISettings } from '../components/AISettings'
import { RulesEngine } from '../components/RulesEngine'
import { EmailVerificationBanner } from '../pages/VerifyEmailPage'
import { useState, useEffect, useRef } from 'react'
import { Shield, ShieldCheck, Key, AlertCircle, Check, X, Fingerprint, Smartphone, Trash2, Camera, Upload, Loader2, Crown, Zap, CreditCard } from 'lucide-react'
import {
  registerPasskey,
  listPasskeys,
  deletePasskey as deletePasskeyHelper,
} from '../services/webauthn'
import { useCurrency } from '../contexts/CurrencyContext'

export function SettingsPage() {
  const { setCurrency } = useCurrency()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Passkeys state
  const [passkeys, setPasskeys] = useState<any[]>([])
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [registeringPasskey, setRegisteringPasskey] = useState(false)
  const [newPasskeyName, setNewPasskeyName] = useState('')

  // Profile editing state
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailChangePassword, setEmailChangePassword] = useState('')
  const [showEditName, setShowEditName] = useState(false)
  const [editName, setEditName] = useState('')
  const [showEditPhone, setShowEditPhone] = useState(false)
  const [editPhone, setEditPhone] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Subscription tier state
  const [userTier, setUserTier] = useState('free')
  const [tierFeatures, setTierFeatures] = useState<any>(null)

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setTwoFAEnabled(data.user.twoFactorEnabled || false)
          setCurrency(data.user.currency || 'USD')
          setEditName(data.user.full_name || '')
          setEditPhone(data.user.phone || '')
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      }
    }
    fetchUser()
    
    // Fetch user tier
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
          setTierFeatures(data.features)
        }
      } catch (err) {
        console.error('Failed to fetch tier:', err)
      }
    }
    fetchTier()

    // Check WebAuthn support
    setWebAuthnSupported(!!window.PublicKeyCredential)

    // Fetch passkeys
    fetchPasskeys()
  }, [])

  const fetchPasskeys = async () => {
    try {
      const data = await listPasskeys()
      setPasskeys(data || [])
    } catch (err) {
      console.error('Failed to fetch passkeys:', err)
    }
  }

  const handleEnable2FA = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to setup 2FA')
      
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setShow2FASetup(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verifyCode })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid code')
      
      setTwoFAEnabled(true)
      setShow2FASetup(false)
      setBackupCodes(data.backupCodes || [])
      setSuccess('2FA enabled successfully!')
      setVerifyCode('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    const code = prompt('Enter your 2FA code to disable:')
    if (!code) return
    
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA')
      
      setTwoFAEnabled(false)
      setSuccess('2FA disabled')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterPasskey = async () => {
    if (!webAuthnSupported) {
      setError('Passkeys are not supported in this browser')
      return
    }

    setLoading(true)
    setError('')
    try {
      await registerPasskey(newPasskeyName || `${navigator.platform} Passkey`)
      setSuccess('Passkey registered successfully!')
      setNewPasskeyName('')
      setRegisteringPasskey(false)
      fetchPasskeys()
    } catch (err: any) {
      setError(err.message || 'Failed to register passkey')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Remove this passkey?')) return

    try {
      await deletePasskeyHelper(id)
      setSuccess('Passkey removed')
      fetchPasskeys()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Profile update handlers
  // Photo upload handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setSelectedPhoto(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return

    setUploadingPhoto(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      
      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(selectedPhoto)
      
      reader.onload = async () => {
        const base64Image = reader.result as string
        
        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatarUrl: base64Image })
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to upload photo')
        
        setUser({ ...user, avatar_url: base64Image })
        setSuccess('Profile photo updated')
        setSelectedPhoto(null)
        setPhotoPreview(null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const cancelPhotoUpload = () => {
    setSelectedPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail || !emailChangePassword) return
    
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail, password: emailChangePassword })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change email')
      
      setUser({ ...user, email: newEmail })
      setSuccess(data.message || 'Email updated. Please verify your new email.')
      setShowChangeEmail(false)
      setNewEmail('')
      setEmailChangePassword('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: editName })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update name')
      
      setUser({ ...user, full_name: editName })
      setSuccess('Name updated')
      setShowEditName(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePhone = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: editPhone })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update phone')
      
      setUser({ ...user, phone: editPhone })
      setSuccess('Phone number updated')
      setShowEditPhone(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || newPassword.length < 8) return
    
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      
      setSuccess(data.message || 'Password changed. Please log in again.')
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      
      // Log out after password change
      setTimeout(() => {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) return
    
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
      
      setSuccess('Account deleted. Redirecting...')
      localStorage.removeItem('token')
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
        </div>
      )}

      {/* Email Verification Banner */}
      {user && (
        <EmailVerificationBanner 
          email={user.email} 
          isVerified={user.email_verified} 
        />
      )}

      {/* Currency Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-2">Currency</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Select your preferred currency for displaying amounts
        </p>
        <CurrencySelector />
      </div>

      {/* Subscription Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            {userTier === 'premium' && <Crown className="h-5 w-5 text-purple-600" />}
            {userTier === 'standard' && <Zap className="h-5 w-5 text-blue-600" />}
            {userTier === 'free' && <CreditCard className="h-5 w-5 text-gray-500" />}
            Subscription
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
            userTier === 'premium' ? 'bg-purple-100 text-purple-700' :
            userTier === 'standard' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {userTier}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Parsing</span>
            <span className={`text-sm font-medium ${tierFeatures?.aiParsing ? 'text-green-600' : 'text-gray-400'}`}>
              {tierFeatures?.aiParsing ? '✓ Included' : '—'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">PDF Support</span>
            <span className={`text-sm font-medium ${tierFeatures?.pdfSupport ? 'text-green-600' : 'text-gray-400'}`}>
              {tierFeatures?.pdfSupport ? '✓ Included' : '—'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Smart Categorization</span>
            <span className={`text-sm font-medium ${tierFeatures?.smartCategorization ? 'text-green-600' : 'text-gray-400'}`}>
              {tierFeatures?.smartCategorization ? '✓ Included' : '—'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-t dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Transactions</span>
            <span className="text-sm font-medium">
              {tierFeatures?.maxTransactionsPerMonth?.toLocaleString() || '100'}
            </span>
          </div>
        </div>
        
        {userTier !== 'premium' && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <a
              href="/subscriptions"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </a>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </h2>

        {/* 2FA Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              {twoFAEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-sm md:text-base">Two-Factor Authentication</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {twoFAEnabled ? 'Enabled' : 'Add an extra layer of security'}
                </p>
              </div>
            </div>
            <button
              onClick={twoFAEnabled ? handleDisable2FA : handleEnable2FA}
              disabled={loading}
              className={`px-3 md:px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                twoFAEnabled
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Loading...' : twoFAEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* 2FA Setup Modal */}
          {show2FASetup && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold pr-2">Set Up 2FA</h3>
                  <button
                    onClick={() => setShow2FASetup(false)}
                    aria-label="Close modal"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center bg-white p-4 rounded-lg">
                    {qrCode && (
                      <img 
                        src={qrCode} 
                        alt="2FA QR Code" 
                        className="w-48 h-48 md:w-56 md:h-56"
                      />
                    )}
                  </div>

                  {/* Manual entry */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Or enter this code manually:
                    </p>
                    <code className="text-xs md:text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded font-mono break-all">
                      {secret}
                    </code>
                  </div>

                  {/* Verification input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter the 6-digit code from your app:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>

                  <button
                    onClick={handleVerify2FA}
                    disabled={loading || verifyCode.length !== 6}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup Codes Display */}
          {backupCodes.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Backup Codes
              </h4>
              <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Save these codes in a safe place. You can use them to access your account if you lose your authenticator.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs md:text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 px-3 py-2 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBackupCodes([])}
                className="mt-3 text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
              >
                I've saved these codes
              </button>
            </div>
          )}

          {/* Passkeys */}
          <div className="border-b dark:border-gray-700 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-sm md:text-base">Passkeys</p>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    Use Face ID, Touch ID, or security key
                  </p>
                </div>
              </div>
              {webAuthnSupported && (
                <button
                  onClick={() => setRegisteringPasskey(true)}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline touch-manipulation"
                >
                  + Add
                </button>
              )}
            </div>

            {/* Passkey list */}
            {passkeys.length > 0 && (
              <div className="space-y-2 mt-3">
                {passkeys.map((pk) => (
                  <div key={pk.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{pk.name || 'Passkey'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Added {new Date(pk.created_at).toLocaleDateString()}
                          {pk.last_used_at && ` · Last used ${new Date(pk.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePasskey(pk.id)}
                      aria-label="Delete passkey"
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add passkey modal */}
            {registeringPasskey && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold pr-2">Add Passkey</h3>
                    <button
                      onClick={() => setRegisteringPasskey(false)}
                      aria-label="Close modal"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={newPasskeyName}
                        onChange={(e) => setNewPasskeyName(e.target.value)}
                        placeholder="e.g., MacBook Pro, iPhone"
                        className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You'll be prompted to use Face ID, Touch ID, or your security key to create a passkey.
                    </p>

                    <button
                      onClick={handleRegisterPasskey}
                      disabled={loading}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
                    >
                      <Fingerprint className="h-5 w-5" />
                      {loading ? 'Registering...' : 'Create Passkey'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!webAuthnSupported && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Passkeys are not supported in this browser. Try Chrome, Safari, or Edge.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <AISettings />
      </div>

      {/* Bank Accounts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <BankConnect />
      </div>

      {/* Account Section */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-semibold mb-4">Account</h2>
          
          {/* Profile Photo */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {/* Current or Preview Photo */}
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                />
              ) : user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {user.fullName?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
              )}
              
              {/* Upload Button Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Change photo"
              >
                <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <p className="font-medium">Profile Photo</p>
              
              {selectedPhoto ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-500">
                    Selected: {selectedPhoto.name} ({(selectedPhoto.size / 1024).toFixed(1)} KB)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelPhotoUpload}
                      disabled={uploadingPhoto}
                      className="px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Click the camera icon to upload a photo. Max 5MB.
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="border-t dark:border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <button
                onClick={() => setShowChangeEmail(!showChangeEmail)}
                className="text-sm text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>
            <span className="font-medium">{user.email}</span>
            {!user.email_verified && (
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                Unverified
              </span>
            )}
            
            {/* Change Email Form */}
            {showChangeEmail && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="password"
                  value={emailChangePassword}
                  onChange={(e) => setEmailChangePassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowChangeEmail(false)}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeEmail}
                    disabled={loading || !newEmail || !emailChangePassword}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className="border-t dark:border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400">Full Name</span>
              <button
                onClick={() => setShowEditName(!showEditName)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showEditName ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {showEditName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            ) : (
              <span className="font-medium">{user.fullName || 'Not set'}</span>
            )}
          </div>

          {/* Phone */}
          <div className="border-t dark:border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400">Phone</span>
              <button
                onClick={() => setShowEditPhone(!showEditPhone)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showEditPhone ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {showEditPhone ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleUpdatePhone}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            ) : (
              <span className="font-medium">{user.phone || 'Not set'}</span>
            )}
          </div>

          {/* Change Password */}
          <div className="border-t dark:border-gray-700 pt-4 mb-4">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="flex items-center justify-between w-full"
            >
              <span className="text-gray-500 dark:text-gray-400">Password</span>
              <span className="text-sm text-blue-600 hover:underline">
                {showChangePassword ? 'Cancel' : 'Change Password'}
              </span>
            </button>
            
            {showChangePassword && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !currentPassword || newPassword.length < 8}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            )}
          </div>

          {/* Member Since */}
          <div className="border-t dark:border-gray-700 pt-4 text-sm text-gray-500">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border-red-200 dark:border-red-800 border">
        <h2 className="text-base md:text-lg font-semibold mb-4 text-red-600">Danger Zone</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-gray-500">This will permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This action cannot be undone. All your transactions, budgets, and data will be permanently deleted.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="w-full px-3 py-2 mb-4 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || !deletePassword}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
