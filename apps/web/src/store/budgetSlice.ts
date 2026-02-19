import { createSlice } from '@reduxjs/toolkit'

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  remaining: number
  status: 'on_track' | 'overspent'
}

interface BudgetState {
  budgets: Budget[]
  loading: boolean
}

const initialState: BudgetState = {
  budgets: [],
  loading: false,
}

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setBudgets: (state, action) => {
      state.budgets = action.payload
    },
  },
})

export const { setBudgets } = budgetSlice.actions
export default budgetSlice.reducer
