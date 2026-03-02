import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import axios from 'axios'
import { Building2, RefreshCw, Trash2, CheckCircle, AlertCircle, Globe, Plus, X, Loader2, Wallet } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Provider {
  id: string
  name: string
  logo: string
  regions: string[]
  supportedInRegion: boolean
  features: string[]
}

interface Country {
  code: string
  name: string
  flag: string
  providers: string[]
}

interface Institution {
  id: string
  name: string
  country: string
  logo?: string
  emoji?: string
  color?: string
}

interface BankAccount {
  id: string
  providerAccountId: string
  name: string
  accountType: string
  accountSubtype?: string
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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(false)
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  const [showInstitutionSelector, setShowInstitutionSelector] = useState(false)
  const [showYodleeConnect, setShowYodleeConnect] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        console.error('Error response:', err.response)
        console.error('Error status:', err.response?.status)
        console.error('Error message:', err.message)
        if (err.response?.status === 404) {
          setError(`Endpoint not found: ${API_URL}/api/bank/providers`)
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to load bank providers. Please try again.')
        }
      }
    }
    fetchProviders()
  }, [])

  // Fetch connected accounts
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/bank/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConnections(response.data.connections || [])
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch connections:', error)
      setError(error.response?.data?.error || 'Failed to fetch connections')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch countries
  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/bank/countries`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCountries(response.data.countries || [])
    } catch (err: any) {
      console.error('Failed to fetch countries:', err)
      setError('Failed to load countries')
    }
  }

  // Fetch institutions for selected country and provider
  const fetchInstitutions = async (countryCode: string, providerId: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${API_URL}/api/bank/institutions/${providerId}?country=${countryCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setInstitutions(response.data.institutions || [])
    } catch (err: any) {
      console.error('Failed to fetch institutions:', err)
      setError('Failed to load banks')
    } finally {
      setLoading(false)
    }
  }

  // Handle country selection
  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setShowCountrySelector(false)
    setShowProviderSelector(true)
  }

  // Handle provider selection
  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
    setShowProviderSelector(false)
    if (selectedCountry) {
      fetchInstitutions(selectedCountry, providerId)
      setShowInstitutionSelector(true)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  // Auto-clear success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          onClick={() => {
            fetchCountries()
            setShowCountrySelector(true)
          }}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Connect Bank
        </button>
      </div>

      {/* Country Selector */}
      {showCountrySelector && (
        <CountrySelector
          countries={countries}
          onSelect={handleCountrySelect}
          onClose={() => setShowCountrySelector(false)}
        />
      )}

      {/* Provider Selector */}
      {showProviderSelector && selectedCountry && (
        <ProviderSelector
          providers={providers.filter(p => p.regions.includes(selectedCountry))}
          country={selectedCountry}
          onSelect={handleProviderSelect}
          onClose={() => setShowProviderSelector(false)}
        />
      )}

      {/* Institution Selector */}
      {showInstitutionSelector && selectedProvider && selectedCountry && (
        <InstitutionSelector
          institutions={institutions}
          provider={selectedProvider}
          country={selectedCountry}
          onSelect={(institution) => {
            console.log('Selected institution:', institution)
            setShowInstitutionSelector(false)
            // For Yodlee, open FastLink after selecting bank
            if (selectedProvider === 'yodlee') {
              setSelectedInstitution(institution)
              setShowYodleeConnect(true)
            }
          }}
          onClose={() => setShowInstitutionSelector(false)}
        />
      )}

      {/* Yodlee Connect */}
      {showYodleeConnect && selectedInstitution && (
        <YodleeConnect
          institution={selectedInstitution}
          onSuccess={() => {
            setShowYodleeConnect(false)
            setSelectedInstitution(null)
            setSelectedProvider(null)
            fetchConnections()
            setSuccessMessage('Bank connected successfully!')
          }}
          onCancel={() => {
            setShowYodleeConnect(false)
            setSelectedInstitution(null)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Plaid Link Modal */}
      {selectedProvider === 'plaid' && (
        <PlaidConnect
          onSuccess={() => {
            setSelectedProvider(null)
            fetchConnections()
            setSuccessMessage('Bank connected successfully!')
          }}
          onCancel={() => setSelectedProvider(null)}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* TrueLayer Link Modal */}
      {selectedProvider === 'truelayer' && (
        <TrueLayerConnect
          onSuccess={() => {
            setSelectedProvider(null)
            fetchConnections()
            setSuccessMessage('Bank connected successfully!')
          }}
          onCancel={() => setSelectedProvider(null)}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Connected Banks ({connections.length})</h4>
          <div className="grid gap-4">
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
        </div>
      )}

      {connections.length === 0 && !showProviderSelector && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No bank accounts connected</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Connect your bank to automatically import transactions and track your spending
          </p>
          <button
            onClick={() => setShowProviderSelector(true)}
            className="mt-4 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium"
          >
            Connect Your First Bank
          </button>
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
      setSuccessMessage('Bank synced successfully!')
    } catch (error: any) {
      console.error('Failed to sync:', error)
      setError(error.response?.data?.error || 'Failed to sync bank')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm('Are you sure you want to disconnect this bank? This will remove all associated accounts and stop syncing transactions.')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/bank/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchConnections()
      setSuccessMessage('Bank disconnected successfully')
    } catch (error: any) {
      console.error('Failed to disconnect:', error)
      setError(error.response?.data?.error || 'Failed to disconnect bank')
    } finally {
      setLoading(false)
    }
  }
}

// Country Selector Component
function CountrySelector({ countries, onSelect, onClose }: {
  countries: Country[]
  onSelect: (code: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  
  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Select Your Country</h3>
          <button onClick={onClose} aria-label="Close country selector" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 border-b dark:border-gray-700">
          <input
            type="text"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid gap-2">
            {filtered.map((country) => (
              <button
                key={country.code}
                onClick={() => onSelect(country.code)}
                className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1">
                  <p className="font-medium">{country.name}</p>
                  <p className="text-sm text-gray-500">
                    {country.providers.length} provider{country.providers.length > 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-4">No countries found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Institution Selector Component
function InstitutionSelector({ institutions, provider: _provider, country: _country, onSelect, onClose }: {
  institutions: Institution[]
  provider: string
  country: string
  onSelect: (institution: Institution) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  // Get initials from bank name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold">Select Your Bank</h3>
            <p className="text-sm text-gray-500">
              {institutions.length} banks available
            </p>
          </div>
          <button onClick={onClose} aria-label="Close bank selector" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b dark:border-gray-700">
          <input
            type="text"
            placeholder="Search banks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Bank List */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid gap-2">
            {paginated.map((institution) => (
              <button
                key={institution.id}
                onClick={() => onSelect(institution)}
                className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                {institution.logo ? (
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm border border-gray-100">
                    <img
                      src={institution.logo.startsWith('/') ? institution.logo : institution.logo}
                      alt={institution.name}
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="h-full w-full flex items-center justify-center text-gray-500 font-bold text-sm">${getInitials(institution.name)}</div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: (institution as any).color || '#6366f1' }}
                  >
                    {getInitials(institution.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{institution.name}</p>
                </div>
              </button>
            ))}
          </div>

          {paginated.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No banks found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Provider Selector Component
function ProviderSelector({ providers, country, onSelect, onClose }: { 
  providers: Provider[]
  country?: string
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

  const countryNames: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    AU: 'Australia',
    CA: 'Canada',
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
    NL: 'Netherlands',
    IE: 'Ireland',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4">
        {/* Header - Fixed */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-semibold text-base">Select Your Bank</h3>
            {country && (
              <p className="text-xs text-primary-600 mt-0.5 font-medium">
                {countryNames[country] || country}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">Connect securely via our trusted providers</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
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
              <p className="font-medium">No bank providers available</p>
              <p className="text-sm mt-1">Please check back later or contact support</p>
            </div>
          )}
          
          {availableProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left min-h-[64px] active:scale-[0.98] group"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{provider.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {provider.regions.slice(0, 3).join(', ')}
                  {provider.regions.length > 3 && ` +${provider.regions.length - 3} more`}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          {unavailableProviders.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mt-6 mb-2 font-medium">Other regions:</p>
              {unavailableProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 opacity-50 cursor-not-allowed"
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

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Your credentials are securely encrypted and never stored on our servers
          </p>
        </div>
      </div>
    </div>
  )
}

// Demo banks for testing
const DEMO_BANKS = [
  { id: 'chase', name: 'Chase Bank', logo: '💳' },
  { id: 'bofa', name: 'Bank of America', logo: '🏦' },
  { id: 'wells', name: 'Wells Fargo', logo: '🏛️' },
  { id: 'citi', name: 'Citibank', logo: '💰' },
  { id: 'us_bank', name: 'US Bank', logo: '🏪' },
  { id: 'capital_one', name: 'Capital One', logo: '💳' },
]

// Plaid Connect Component
function PlaidConnect({ onSuccess, onCancel, onError }: { 
  onSuccess: () => void, 
  onCancel: () => void,
  onError: (msg: string) => void
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `${API_URL}/api/bank/link-token/plaid`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (response.data.link_token) {
          // Check if this is a demo token
          if (response.data.link_token.startsWith('demo-')) {
            console.log('Demo mode detected')
            setIsDemo(true)
          } else {
            console.log('Real Plaid link token received')
            setLinkToken(response.data.link_token)
          }
        } else {
          setError('Failed to get Plaid link token')
        }
      } catch (err: any) {
        console.error('Failed to fetch link token:', err)
        const errorMsg = err.response?.data?.error || 'Failed to initialize Plaid'
        setError(errorMsg)
        onError(errorMsg)
      }
    }
    fetchLinkToken()
  }, [onError])

  const handleDemoBankSelect = (bankId: string) => {
    setSelectedBank(bankId)
    setShowCredentials(true)
  }

  const handleDemoConnect = async () => {
    if (!selectedBank) return
    
    setIsConnecting(true)
    try {
      const token = localStorage.getItem('token')
      const bank = DEMO_BANKS.find(b => b.id === selectedBank)
      
      await axios.post(
        `${API_URL}/api/bank/connect/plaid`,
        { 
          public_token: `demo-token-${selectedBank}-${Date.now()}`, 
          metadata: {
            institution: { name: bank?.name || 'Demo Bank', id: selectedBank }
          } 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
    } catch (err: any) {
      console.error('Failed to connect:', err)
      const errorMsg = err.response?.data?.error || 'Failed to connect bank'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setIsConnecting(false)
    }
  }

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    console.log('Plaid Link success:', metadata)
    setIsConnecting(true)
    
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/api/bank/connect/plaid`,
        { 
          public_token, 
          metadata: {
            institution: metadata.institution,
            account: metadata.account
          } 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
    } catch (err: any) {
      console.error('Failed to connect:', err)
      const errorMsg = err.response?.data?.error || 'Failed to connect bank'
      setError(errorMsg)
      onError(errorMsg)
      setIsConnecting(false)
    }
  }, [onSuccess, onError])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err, metadata) => {
      console.log('Plaid Link exited:', err, metadata)
      if (err) {
        onError(err.display_message || 'Connection cancelled')
      }
      onCancel()
    },
    onEvent: (eventName, metadata) => {
      console.log('Plaid event:', eventName, metadata)
    },
  })

  // Auto-open Plaid when ready (real mode)
  useEffect(() => {
    if (ready && linkToken && !isDemo && !isConnecting) {
      console.log('Opening Plaid Link...')
      open()
    }
  }, [ready, linkToken, open, isDemo, isConnecting])

  // Demo Mode UI
  if (isDemo) {
    if (showCredentials && selectedBank) {
      const bank = DEMO_BANKS.find(b => b.id === selectedBank)
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{bank?.logo}</span>
              <div>
                <h3 className="font-semibold text-lg">{bank?.name}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  Demo Mode
                </span>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  placeholder="user_good"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  placeholder="pass_good"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">💡 Demo credentials:</span> username = "user_good", password = "pass_good"
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDemoConnect}
                disabled={isConnecting}
                className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
              <button
                onClick={() => setShowCredentials(false)}
                disabled={isConnecting}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Select Your Bank</h3>
              <p className="text-sm text-gray-500 mt-0.5">Choose a bank to connect</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Demo Mode
            </span>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {DEMO_BANKS.map((bank) => (
              <button
                key={bank.id}
                onClick={() => handleDemoBankSelect(bank.id)}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left disabled:opacity-50"
              >
                <span className="text-2xl">{bank.logo}</span>
                <span className="font-medium">{bank.name}</span>
              </button>
            ))}
          </div>
          
          <button 
            onClick={onCancel}
            disabled={isConnecting}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
        <div className="bg-white rounded-xl p-6 w-full max-w-md text-center shadow-2xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Connection Failed</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
        <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-2xl">
          <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-medium text-lg mb-2">Connecting...</p>
          <p className="text-sm text-gray-500">Please complete the process in the Plaid window</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-2xl">
        <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="font-medium text-lg mb-2">Initializing Plaid...</p>
        <p className="text-sm text-gray-500 mb-6">Connecting to 12,000+ banks securely</p>
        
        <button 
          onClick={onCancel}
          className="px-6 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// TrueLayer Connect Component
function TrueLayerConnect({ onSuccess, onCancel, onError }: { 
  onSuccess: () => void, 
  onCancel: () => void,
  onError: (msg: string) => void
}) {
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthUrl = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `${API_URL}/api/bank/link-token/truelayer`,
          { redirectUri: `${window.location.origin}/settings` },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        const rawToken = response.data.link_token
        if (rawToken) {
          try {
            const decoded = JSON.parse(atob(rawToken))
            const url = decoded.authUrl
            console.log('[TrueLayer] Decoded payload keys:', Object.keys(decoded))
            console.log('[TrueLayer] URL being opened:', url)
            if (!url || typeof url !== 'string') {
              console.error('[TrueLayer] Missing authUrl in decoded payload:', decoded)
              setError('Invalid authentication URL')
              onError('Failed to initialize TrueLayer')
              return
            }
            setAuthUrl(url)
          } catch (e) {
            console.error('[TrueLayer] Decode/layout error:', e)
            console.error('[TrueLayer] Raw link_token (first 80 chars):', typeof rawToken === 'string' ? rawToken.slice(0, 80) + '...' : rawToken)
            setError('Invalid authentication URL')
            onError('Failed to initialize TrueLayer')
          }
        } else {
          setError('No link token received')
          onError('Failed to initialize TrueLayer')
        }
      } catch (error: any) {
        console.error('Failed to fetch TrueLayer auth URL:', error)
        const errorMsg = error.response?.data?.error || 'Failed to initialize TrueLayer'
        setError(errorMsg)
        onError(errorMsg)
      }
    }
    fetchAuthUrl()
  }, [onError])

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

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md text-center shadow-2xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Connection Failed</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-2xl">
        <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="font-medium text-lg mb-2">Connecting to TrueLayer...</p>
        <p className="text-sm text-gray-500 mb-6">Please wait while we open the authentication window</p>
        <button 
          onClick={onCancel}
          className="px-6 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Yodlee Connect Component
function YodleeConnect({ 
  institution, 
  onSuccess, 
  onCancel, 
  onError 
}: { 
  institution: Institution
  onSuccess: () => void
  onCancel: () => void
  onError: (msg: string) => void
}) {
  const [fastlinkUrl, setFastlinkUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const fetchFastlinkUrl = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Please log in to connect bank accounts')
          onError('Please log in')
          return
        }

        // Get FastLink URL from backend
        const response = await axios.post(
          `${API_URL}/api/bank/link-token/yodlee`,
          { 
            redirectUri: `${window.location.origin}/settings`,
            institutionId: institution.id 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.link_token) {
          // Decode the base64 link token to get the URL
          const decoded = JSON.parse(atob(response.data.link_token))
          console.log('Yodlee FastLink URL:', decoded.authUrl)
          setFastlinkUrl(decoded.authUrl)
        } else {
          setError('No link token received')
          onError('Failed to initialize Yodlee')
        }
      } catch (error: any) {
        console.error('Failed to fetch Yodlee FastLink URL:', error)
        const errorMsg = error.response?.data?.error || 'Failed to initialize Yodlee'
        setError(errorMsg)
        onError(errorMsg)
      }
    }
    fetchFastlinkUrl()
  }, [institution, onError])

  // Open FastLink in popup and watch for it to close
  const openFastLinkPopup = () => {
    if (!fastlinkUrl) return
    
    const width = 500
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    
    const popup = window.open(
      fastlinkUrl,
      'YodleeFastLink',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      setError('Popup blocked. Please allow popups for this site.')
      onError('Popup blocked')
      return
    }

    // Poll for popup close
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        // User closed the popup, assume they completed auth
        handleSuccess()
      }
    }, 1000)

    // Cleanup after 10 minutes
    setTimeout(() => {
      clearInterval(timer)
      if (!popup.closed) {
        popup.close()
      }
    }, 600000)
  }

  // Handle success - create the connection
  const handleSuccess = async () => {
    try {
      setIsConnecting(true)
      const token = localStorage.getItem('token')
      
      // Create the connection with mock data for demo
      await axios.post(
        `${API_URL}/api/bank/connect/yodlee`,
        { 
          public_token: `yodlee-${institution.id}-${Date.now()}`,
          metadata: { 
            institution: institution,
            accounts: [
              {
                id: `acc-${Date.now()}`,
                name: 'Savings Account',
                type: 'SAVINGS',
                balance: { current: 5000.00, available: 5000.00, currency: 'AUD' }
              },
              {
                id: `acc-${Date.now()}-2`,
                name: 'Checking Account', 
                type: 'CHECKING',
                balance: { current: 2500.00, available: 2500.00, currency: 'AUD' }
              }
            ]
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
    } catch (error: any) {
      console.error('Failed to complete Yodlee connection:', error)
      onError(error.response?.data?.error || 'Failed to complete connection')
    } finally {
      setIsConnecting(false)
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md text-center shadow-2xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Connection Failed</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-2xl">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-primary-600" />
        </div>
        
        <h3 className="font-semibold text-lg mb-2">Connect {institution.name}</h3>
        <p className="text-sm text-gray-500 mb-6">
          You'll be redirected to Yodlee to securely connect your bank account.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Note:</span> Yodlee FastLink requires domain registration. 
            For demo purposes, click "Connect Demo Account" to simulate a successful connection.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={openFastLinkPopup}
            disabled={!fastlinkUrl || isConnecting}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Open Yodlee FastLink
              </>
            )}
          </button>
          
          <button
            onClick={handleSuccess}
            disabled={isConnecting}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Connect Demo Account
          </button>
          
          <button 
            onClick={onCancel}
            disabled={isConnecting}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
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

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0)
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {connection.institutionLogoUrl ? (
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm border border-gray-100">
              <img
                src={connection.institutionLogoUrl}
                alt={connection.institutionName}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const initials = connection.institutionName
                      .split(' ')
                      .map(word => word[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                    parent.innerHTML = `<div class="h-full w-full flex items-center justify-center text-gray-500 font-bold text-sm bg-gray-100">${initials}</div>`;
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{connection.institutionName}</p>
            <div className="flex items-center gap-2 text-sm mt-0.5">
              {connection.syncStatus === 'synced' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">Synced</span>
                </>
              ) : connection.syncStatus === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 font-medium">Error</span>
                </>
              ) : connection.syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                  <span className="text-blue-600 font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                  <span className="text-gray-500">{connection.syncStatus}</span>
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

        <div className="flex items-center gap-1">
          <button
            onClick={onSync}
            disabled={loading || connection.syncStatus === 'syncing'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sync now"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${loading || connection.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onDisconnect}
            disabled={loading}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Disconnect"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Accounts */}
      {connection.accounts.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          {connection.accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">{account.name}</span>
                {account.mask && (
                  <span className="text-xs text-gray-400">···{account.mask}</span>
                )}
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 capitalize">
                  {account.accountSubtype || account.accountType}
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(account.currentBalance, account.currency)}
                </p>
                {account.availableBalance !== account.currentBalance && (
                  <p className="text-xs text-gray-500">
                    Available: {formatCurrency(account.availableBalance, account.currency)}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {connection.accounts.length > 1 && (
            <div className="border-t border-gray-100 pt-3 mt-2">
              <div className="flex justify-between text-sm px-3">
                <span className="text-gray-600 font-medium">Total Balance</span>
                <span className="font-bold text-lg">
                  {formatCurrency(totalBalance, connection.accounts[0]?.currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {connection.accounts.length === 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 text-center py-2">
            No accounts found. Try syncing to refresh.
          </p>
        </div>
      )}
    </div>
  )
}
