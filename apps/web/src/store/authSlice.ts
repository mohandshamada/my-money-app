import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { authenticatePasskey } from '../services/webauthn'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const AUTH_BASE = API_URL.startsWith('http') ? `${API_URL}/api` : API_URL

interface User {
  id: string
  email: string
  fullName?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start in loading state until session is validated
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await axios.post(`${AUTH_BASE}/auth/login`, credentials)
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    return response.data
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; fullName?: string }) => {
    const response = await axios.post(`${AUTH_BASE}/auth/register`, data)
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    return response.data
  }
)

export const loginWithPasskey = createAsyncThunk(
  'auth/loginWithPasskey',
  async () => {
    const data = await authenticatePasskey()
    localStorage.setItem('token', data.token)
    // Passkey login might not return refresh token initially, check backend
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }
    return data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    clearError: (state) => {
      state.error = null
    },
    restoreSession: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.isLoading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Registration failed'
      })
      // Passkey Login
      .addCase(loginWithPasskey.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithPasskey.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(loginWithPasskey.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Passkey login failed'
      })
  },
})

export const { logout, clearError, restoreSession, setLoading } = authSlice.actions
export default authSlice.reducer
