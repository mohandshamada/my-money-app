import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Check, AlertCircle, Trash2, Edit2, Lock, Eye, EyeOff } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export function AISettings() {
  const [provider, setProvider] = useState('local')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [keysStatus, setKeysStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [editingKey, setEditingKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const res = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const data = res.data
      setProvider(data.ai_provider || 'local')
      setModel(data.ai_model || '')
      setEnabled(data.ai_enabled || false)
      setHasApiKey(data.has_api_key || false)
      setKeysStatus(data.keys_status || {})
    } catch (err) {
      console.error('Failed to fetch AI settings:', err)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const token = localStorage.getItem('token')
      const payload: any = {
        ai_provider: provider,
        ai_model: model,
        ai_enabled: enabled
      }
      
      // Only send API key if it's changed and not empty
      if (apiKey && apiKey.trim() !== '') {
        payload.ai_api_key = apiKey
      }
      
      const res = await axios.put(`${API_URL}/api/settings/ai`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setHasApiKey(res.data.has_api_key)
      if (res.data.keys_status) {
        setKeysStatus(res.data.keys_status)
      }
      setApiKey('') // Clear input after saving
      setEditingKey(false) // Lock the field again
      setMessage({ type: 'success', text: 'AI settings saved successfully' })
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to save settings' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/settings/ai`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Update keys status for current provider
      setKeysStatus(prev => ({...prev, [provider]: false}))
      setHasApiKey(false)
      setApiKey('')
      setEditingKey(false)
      setShowDeleteConfirm(false)
      setMessage({ type: 'success', text: 'API key deleted successfully' })
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to delete API key' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)
    
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(`${API_URL}/api/settings/ai/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setMessage({ type: 'success', text: `Connection successful! Reply: ${res.data.result}` })
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to connect to AI provider' 
      })
    } finally {
      setTesting(false)
    }
  }

  const startEditing = () => {
    setEditingKey(true)
    setApiKey('') // Clear any previous input
    setTimeout(() => {
      document.getElementById('api-key-input')?.focus()
    }, 100)
  }

  const cancelEditing = () => {
    setEditingKey(false)
    setApiKey('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Assistant Settings
        </h2>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <Check className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
          <p>{message.text}</p>
        </div>
      )}

      {enabled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="block text-sm font-medium mb-1">AI Provider</label>
            <select
              value={provider}
              onChange={(e) => {
                const newProvider = e.target.value;
                setProvider(newProvider);
                setApiKey(''); // Clear any partial input
                // Check if this specific provider has a key
                const hasKeyForProvider = keysStatus[newProvider];
                setHasApiKey(hasKeyForProvider || false);
                // If switching to a provider and we don't have a key for it, enable editing
                if (newProvider !== 'local' && !hasKeyForProvider) {
                  setEditingKey(true);
                } else {
                  setEditingKey(false);
                }
              }}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="local">Local (Rule-based, No API Key needed)</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="zai">Z.ai (GLM-5)</option>
              <option value="kimi">Kimi (Moonshot)</option>
              <option value="huggingface">Hugging Face 🤗</option>
            </select>
          </div>

          {provider !== 'local' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">
                    API Key
                    {keysStatus[provider] && !editingKey && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1 inline-flex">
                        <Lock className="h-3 w-3" />
                        Key is set for {provider}
                      </span>
                    )}
                  </label>
                  
                  {/* Action buttons when key exists for this provider and not editing */}
                  {keysStatus[provider] && !editingKey && (
                    <div className="flex gap-2">
                      <button
                        onClick={startEditing}
                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-3 w-3" />
                        Change
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    id="api-key-input"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={!editingKey && hasApiKey}
                    placeholder={editingKey ? "Enter new API Key" : "••••••••••••••••••••••"}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 pr-10 ${
                      !editingKey && hasApiKey ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                    }`}
                  />
                  
                  {/* Show/hide button */}
                  {editingKey && (
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                
                {/* Cancel button when editing */}
                {editingKey && (
                  <button
                    onClick={cancelEditing}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                  >
                    Cancel
                  </button>
                )}
                
                {!editingKey && hasApiKey && (
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is securely stored and encrypted
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Model (Optional)
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini, anthropic/claude-3-haiku, meta-llama/Llama-3.2-11B-Vision-Instruct"
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use the provider's default model</p>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={loading || (provider !== 'local' && editingKey && !apiKey)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            
            {provider !== 'local' && keysStatus[provider] && !editingKey && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete API Key?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will remove your API key from our database. You'll need to enter it again to use AI features.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteKey}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}