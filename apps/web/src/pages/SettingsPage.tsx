import { CurrencySelector } from '../components/CurrencySelector'
import { BankConnect } from '../components/BankConnect'
import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, Key, AlertCircle, Check, X, Fingerprint, Smartphone, Trash2 } from 'lucide-react'
import {
  startRegistration,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'
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

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setTwoFAEnabled(data.user.twoFactorEnabled || false)
          setCurrency(data.user.currency || 'USD')
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      }
    }
    fetchUser()

    // Check WebAuthn support
    setWebAuthnSupported(browserSupportsWebAuthn())

    // Fetch passkeys
    fetchPasskeys()
  }, [])

  const fetchPasskeys = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/passkeys', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPasskeys(data.passkeys || [])
      }
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

    setRegisteringPasskey(true)
    setError('')
    try {
      const token = localStorage.getItem('token')

      // Get registration options
      const startRes = await fetch('/api/auth/passkey/register/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const options = await startRes.json()

      // Start WebAuthn registration
      const attResp = await startRegistration(options)

      // Verify registration
      const verifyRes = await fetch('/api/auth/passkey/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          credential: attResp,
          name: newPasskeyName || `${navigator.platform} Passkey`
        })
      })

      const result = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(result.error || 'Registration failed')

      setSuccess('Passkey registered successfully!')
      setNewPasskeyName('')
      fetchPasskeys()
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Registration cancelled')
      } else {
        setError(err.message || 'Failed to register passkey')
      }
    } finally {
      setRegisteringPasskey(false)
    }
  }

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Remove this passkey?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/auth/passkeys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to delete passkey')

      setSuccess('Passkey removed')
      fetchPasskeys()
    } catch (err: any) {
      setError(err.message)
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

      {/* Currency Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-2">Currency</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Select your preferred currency for displaying amounts
        </p>
        <CurrencySelector />
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
              className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
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
                  <h3 className="text-lg font-semibold">Set Up 2FA</h3>
                  <button 
                    onClick={() => setShow2FASetup(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-manipulation"
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
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation"
                      title="Remove passkey"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add passkey modal */}
            {registeringPasskey && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Passkey</h3>
                    <button
                      onClick={() => setRegisteringPasskey(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-manipulation"
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
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
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

      {/* Bank Accounts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
        <BankConnect />
      </div>

      {/* Account Section */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium truncate ml-4">{user.email}</span>
            </div>
            {user.fullName && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="font-medium">{user.fullName}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
