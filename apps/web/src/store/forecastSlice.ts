import { createSlice } from '@reduxjs/toolkit'

interface ForecastDay {
  date: string
  projectedBalance: number
  confidenceLow68: number
  confidenceHigh68: number
}

interface ForecastState {
  forecast: ForecastDay[]
  summary: {
    currentBalance: number
    projectedBalance30d: number
  } | null
  loading: boolean
}

const initialState: ForecastState = {
  forecast: [],
  summary: null,
  loading: false,
}

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    setForecast: (state, action) => {
      state.forecast = action.payload.forecast
      state.summary = action.payload.summary
    },
  },
})

export const { setForecast } = forecastSlice.actions
export default forecastSlice.reducer
