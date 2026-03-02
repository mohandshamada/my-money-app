// Polyfills for Node.js modules
import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'

import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { store } from './src/store'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  )
}
