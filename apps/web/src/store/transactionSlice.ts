import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface Transaction {
  id: string
  amount: number
  isExpense: boolean
  merchant?: string
  description?: string
  date: string
  category: string
  subcategory?: string
  tags?: string[]
  pending: boolean
  isRecurring?: boolean
}

interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  total: number
  monthlyTotal: number
  categories: string[]
}

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  total: 0,
  monthlyTotal: 0,
  categories: [],
}

// Fetch all transactions
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

// Create transaction
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (data: Partial<Transaction>, { getState }) => {
    const token = (getState() as any).auth.token
    const response = await axios.post(`${API_URL}/api/transactions`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
)

// Update transaction
export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async ({ id, data }: { id: string; data: Partial<Transaction> }, { getState }) => {
    const token = (getState() as any).auth.token
    const response = await axios.patch(`${API_URL}/api/transactions/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
)

// Delete transaction
export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id: string, { getState }) => {
    const token = (getState() as any).auth.token
    await axios.delete(`${API_URL}/api/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return id
  }
)

// Import CSV
export const importTransactionsCSV = createAsyncThunk(
  'transactions/importCSV',
  async (formData: FormData, { getState }) => {
    const token = (getState() as any).auth.token
    const response = await axios.post(`${API_URL}/api/transactions/import`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
)

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCategories: (state, action) => {
      state.categories = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload.transactions || []
        state.total = action.payload.total || 0
        // Calculate monthly total
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        state.monthlyTotal = state.transactions
          .filter(t => new Date(t.date) >= startOfMonth && t.isExpense)
          .reduce((sum, t) => sum + t.amount, 0)
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch transactions'
      })
      // Create
      .addCase(createTransaction.pending, (state) => {
        state.loading = true
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false
        state.transactions.unshift(action.payload)
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create transaction'
      })
      // Update
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false
        const index = state.transactions.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.transactions[index] = action.payload
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update transaction'
      })
      // Delete
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = state.transactions.filter(t => t.id !== action.payload)
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete transaction'
      })
  },
})

export const { clearError, setCategories } = transactionSlice.actions
export default transactionSlice.reducer
