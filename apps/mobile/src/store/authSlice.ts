import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://api.cashflow.app' // Change to your API URL

interface User {
  id: string
  email: string
  fullName?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials)
    await SecureStore.setItemAsync('token', response.data.token)
    await SecureStore.setItemAsync('refreshToken', response.data.refreshToken)
    return response.data
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; fullName?: string }) => {
    const response = await axios.post(`${API_URL}/auth/register`, data)
    await SecureStore.setItemAsync('token', response.data.token)
    await SecureStore.setItemAsync('refreshToken', response.data.refreshToken)
    return response.data
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    const token = await SecureStore.getItemAsync('token')
    if (!token) throw new Error('No token')
    return { token }
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
      SecureStore.deleteItemAsync('token')
      SecureStore.deleteItemAsync('refreshToken')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Login failed'
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Registration failed'
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isAuthenticated = false
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
