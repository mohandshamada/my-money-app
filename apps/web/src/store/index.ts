import { configureStore } from '@reduxjs/toolkit'
import authReducer from './store/authSlice'
import transactionReducer from './store/transactionSlice'
import budgetReducer from './store/budgetSlice'
import forecastReducer from './store/forecastSlice'

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
