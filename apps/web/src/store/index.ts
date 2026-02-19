import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import transactionReducer from './transactionSlice'
import budgetReducer from './budgetSlice'
import forecastReducer from './forecastSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    budgets: budgetReducer,
    forecast: forecastReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
