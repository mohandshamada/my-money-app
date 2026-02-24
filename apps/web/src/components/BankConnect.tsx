import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import axios from 'axios'
import { Building2, RefreshCw, Trash2, CheckCircle, AlertCircle, Globe, Plus, X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Provider {
  id: string
  name: string
  logo: string
  regions: string[]
  supportedInRegion: boolean
  features: string[]
}

interface BankAccount {
  id: string
  providerAccountId: string
  name: string
  accountType: string
  currentBalance: number
  availableBalance: number
  currency: string
  mask?: string
}

interface BankConnection {
  id: string
  provider: string
  institutionName: string
  institutionLogoUrl?: string
  institutionId?: string
  syncStatus: string
  lastSyncedAt?: string
  accounts: BankAccount[]
}

export function BankConnect() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Please log in to connect bank accounts')
          return
        }
        
        console.log('Fetching providers from:', `${API_URL}/api/bank/providers`)
        const response = await axios.get(`${API_URL}/api/bank/providers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        console.log('Providers response:', response.data)
        setProviders(response.data.providers || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch providers:', err)
        setError(err.response?.data?.error || 'Failed to load bank providers. Please try again.')
      }
    }
    fetchProviders()
  }, [])

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bankSuccess = params.get('bank_success')
    const bankError = params.get('bank_error')
    const bankToken = params.get('token')
    
    if (bankSuccess && bankToken) {
      // Clear URL params first to prevent re-triggering
      window.history.replaceState({}, '', '/settings')
      
      // Complete the connection
      const completeConnection = async () => {
        try {
          const token = localStorage.getItem('token')
          await axios.post(
            `${API_URL}/api/bank/connect/${bankSuccess}`,
            { public_token: bankToken, metadata: {} },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          // Refresh connections
          fetchConnections()
        } catch (err) {
          console.error('Failed to complete connection:', err)
          setError('Failed to complete bank connection')
        }
      }
      completeConnection()
    } else if (bankError) {
      setError(`Bank connection failed: ${bankError}`)
      // Clear URL params
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  // Fetch connected accounts
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/bank/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConnections(response.data.connections)
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading banks</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Bank Accounts
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect your bank accounts to automatically sync transactions
          </p>
        </div>
        <button
          onClick={() => setShowProviderSelector(!showProviderSelector)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Connect Bank
        </button>
      </div>

      {/* Provider Selector */}
      {showProviderSelector && (
        <ProviderSelector
          providers={providers}
          onSelect={(providerId) => {
            setSelectedProvider(providerId)
            setShowProviderSelector(false)
          }}
          onClose={() => setShowProviderSelector(false)}
        />
      )}

      {/* Plaid Link Modal */}
      {selectedProvider === 'plaid' && (
        <PlaidConnect
          onSuccess={() => {
            setSelectedProvider(null)
            fetchConnections()
          }}
          onCancel={() => setSelectedProvider(null)}
        />
      )}

      {/* TrueLayer Link Modal */}
      {selectedProvider === 'truelayer' && (
        <TrueLayerConnect
          onSuccess={() => {
            setSelectedProvider(null)
            fetchConnections()
          }}
          onCancel={() => setSelectedProvider(null)}
        />
      )}

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Connected Banks</h4>
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onSync={() => handleSync(connection.id)}
              onDisconnect={() => handleDisconnect(connection.id)}
              loading={loading}
            />
          ))}
        </div>
      )}

      {connections.length === 0 && !showProviderSelector && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No bank accounts connected</p>
          <p className="text-sm text-gray-500 mt-1">
            Connect your bank to automatically import transactions
          </p>
        </div>
      )}
    </div>
  )

  async function handleSync(connectionId: string) {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/api/bank/sync/${connectionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await fetchConnections()
    } catch (error) {
      console.error('Failed to sync:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm('Are you sure you want to disconnect this bank?')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/bank/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchConnections()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    } finally {
      setLoading(false)
    }
  }
}

// Provider Selector Component
function ProviderSelector({ providers, onSelect, onClose }: { 
  providers: Provider[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const availableProviders = providers.filter(p => p.supportedInRegion)
  const unavailableProviders = providers.filter(p => !p.supportedInRegion)
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-base">Select Your Bank</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {availableProviders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No bank providers available.</p>
              <p className="text-sm mt-1">Please check back later.</p>
            </div>
          )}
          
          {availableProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 hover:border-primary-500 hover:bg-primary-50 transition-colors text-left min-h-[64px] active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{provider.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {provider.regions.slice(0, 3).join(', ')}
                  {provider.regions.length > 3 && ` +${provider.regions.length - 3} more`}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            </button>
          ))}

          {unavailableProviders.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mt-6 mb-2 font-medium">Other regions:</p>
              {unavailableProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 opacity-50"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-600">{provider.name}</p>
                    <p className="text-xs text-gray-400">Not available in your region</p>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Bottom padding for mobile safe area */}
          <div className="h-6 sm:h-0" />
        </div>
      </div>
    </div>
  )
}

// Plaid Connect Component
function PlaidConnect({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `${API_URL}/api/bank/link-token/plaid`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setLinkToken(response.data.link_token)
      } catch (error) {
        console.error('Failed to fetch link token:', error)
      }
    }
    fetchLinkToken()
  }, [])

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/api/bank/connect/plaid`,
        { public_token, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }, [onSuccess])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onCancel,
  })

  useEffect(() => {
    if (ready && linkToken) {
      open()
    }
  }, [ready, linkToken, open])

  return null
}

// TrueLayer Connect Component
function TrueLayerConnect({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthUrl = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `${API_URL}/api/bank/link-token/truelayer`,
          { redirectUri: `${window.location.origin}/settings` },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        // Decode the link token to get auth URL
        const decoded = JSON.parse(atob(response.data.link_token))
        setAuthUrl(decoded.authUrl)
      } catch (error) {
        console.error('Failed to fetch TrueLayer auth URL:', error)
      }
    }
    fetchAuthUrl()
  }, [])

  useEffect(() => {
    if (authUrl) {
      // Open TrueLayer auth in popup
      const width = 500
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      const popup = window.open(
        authUrl,
        'TrueLayer Auth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      )

      if (!popup) {
        // Popup blocked - redirect in same window
        window.location.href = authUrl
        return
      }

      // Poll for popup close
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer)
          onSuccess()
        }
      }, 500)

      return () => clearInterval(timer)
    }
  }, [authUrl, onSuccess])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Connecting to TrueLayer...</p>
        <button 
          onClick={onCancel}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Connection Card Component
function ConnectionCard({ 
  connection, 
  onSync, 
  onDisconnect, 
  loading 
}: { 
  connection: BankConnection
  onSync: () => void
  onDisconnect: () => void
  loading: boolean
}) {
  const totalBalance = connection.accounts.reduce(
    (sum, acc) => sum + (acc.currentBalance || 0), 
    0
  )

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {connection.institutionLogoUrl ? (
            <img
              src={connection.institutionLogoUrl}
              alt={connection.institutionName}
              className="h-10 w-10 rounded object-contain"
            />
          ) : (
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div>
            <p className="font-medium">{connection.institutionName}</p>
            <div className="flex items-center gap-2 text-sm">
              {connection.syncStatus === 'synced' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Synced</span>
                </>
              ) : connection.syncStatus === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Error</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                  <span className="text-blue-600">Syncing...</span>
                </>
              )}
              {connection.lastSyncedAt && (
                <span className="text-gray-400">
                  · {new Date(connection.lastSyncedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sync now"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onDisconnect}
            disabled={loading}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            title="Disconnect"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Accounts */}
      {connection.accounts.length > 0 && (
        <div className="border-t pt-4 space-y-2">
          {connection.accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{account.name}</span>
                {account.mask && (
                  <span className="text-xs text-gray-400">···{account.mask}</span>
                )}
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                  {account.accountType}
                </span>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: account.currency || 'USD'
                  }).format(account.currentBalance || 0)}
                </p>
                {account.availableBalance !== account.currentBalance && (
                  <p className="text-xs text-gray-500">
                    Available: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD'
                    }).format(account.availableBalance || 0)}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {connection.accounts.length > 1 && (
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Balance</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: connection.accounts[0]?.currency || 'USD'
                  }).format(totalBalance)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
