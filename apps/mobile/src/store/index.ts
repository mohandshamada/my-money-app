import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import transactionReducer from './transactionSlice'
import budgetReducer from './budgetSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    budgets: budgetReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
