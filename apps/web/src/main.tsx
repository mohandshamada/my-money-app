import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { store } from './store'
import { ToastProvider } from './components/Toast'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { AuthInitializer } from './components/AuthInitializer'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AuthInitializer>
          <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </CurrencyProvider>
          </QueryClientProvider>
        </AuthInitializer>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
)
