import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import axios from 'axios'
import { Building2, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface BankAccount {
  id: string
  plaidAccountId: string
  name: string
  accountType: string
  currentBalance: number
}

interface BankConnection {
  id: string
  institutionName: string
  institutionLogoUrl?: string
  syncStatus: string
  lastSyncedAt?: string
  accounts: BankAccount[]
}

export function PlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch link token
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `${API_URL}/api/bank/link-token`,
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

  // Fetch connected accounts
  const fetchConnections = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/bank/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConnections(response.data.connections)
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  // Plaid Link success handler
  const onSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        await axios.post(
          `${API_URL}/api/bank/exchange-token`,
          {
            public_token,
            institution_name: metadata.institution.name,
            institution_logo: metadata.institution.logo,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        await fetchConnections()
      } catch (error) {
        console.error('Failed to exchange token:', error)
      } finally {
        setLoading(false)
      }
    },
    [fetchConnections]
  )

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  })

  // Sync transactions
  const handleSync = async (itemId: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/api/bank/sync/${itemId}`,
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

  // Disconnect bank
  const handleDisconnect = async (itemId: string) => {
    if (!confirm('Are you sure you want to disconnect this bank account?')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/bank/disconnect/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchConnections()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connect Button */}
      <button
        onClick={() => open()}
        disabled={!ready || loading}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        <Building2 className="h-5 w-5" />
        {loading ? 'Connecting...' : 'Connect Bank Account'}
      </button>

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Connected Banks</h3>
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {connection.institutionLogoUrl ? (
                    <img
                      src={connection.institutionLogoUrl}
                      alt={connection.institutionName}
                      className="h-10 w-10 rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{connection.institutionName}</p>
                    <div className="flex items-center gap-1 text-sm">
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
                        <span className="text-gray-500">
                          · {new Date(connection.lastSyncedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(connection.id)}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Sync now"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
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
                <div className="mt-4 pt-4 border-t space-y-2">
                  {connection.accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{account.name}</span>
                      <span className="font-medium">
                        ${account.currentBalance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}