import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Transaction {
  id: string
  amount: number
  isExpense: boolean
  merchant?: string
  description?: string
  date: string
  category: string
  pending: boolean
}

interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  total: number
}

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  total: 0,
}

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_, { getState }) => {
    const token = (getState() as any).auth.token
    const response = await axios.get(`${API_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
)

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload.transactions
        state.total = action.payload.total
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch transactions'
      })
  },
})

export default transactionSlice.reducer
