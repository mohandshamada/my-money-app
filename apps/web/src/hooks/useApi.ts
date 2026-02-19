import { useState, useCallback } from 'react'
import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export function useApi<T = any>(options: UseApiOptions<T> = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const request = useCallback(async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any
  ) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await axios({
        method,
        url: `${API_URL}${url}`,
        data: body,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })

      setData(response.data)
      options.onSuccess?.(response.data)
      return response.data
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>
      const errorMessage = axiosError.response?.data?.error || axiosError.message || 'Request failed'
      setError(errorMessage)
      options.onError?.(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [options])

  const get = useCallback((url: string) => request('GET', url), [request])
  const post = useCallback((url: string, body: any) => request('POST', url, body), [request])
  const put = useCallback((url: string, body: any) => request('PUT', url, body), [request])
  const del = useCallback((url: string) => request('DELETE', url), [request])

  return { loading, error, data, get, post, put, del, setData, setError }
}

// Hook for simple fetch with auto-retry
export function useFetch<T>(url: string, autoFetch = true) {
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}${url}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })
      setData(response.data)
      return response.data
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>
      const errorMessage = axiosError.response?.data?.error || 'Failed to fetch'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url])

  // Auto-fetch on mount if enabled
  useState(() => {
    if (autoFetch) {
      fetch()
    }
  })

  return { loading, error, data, fetch, refetch: fetch }
}
