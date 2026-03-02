import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

// Screens
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { TransactionsScreen } from '../screens/TransactionsScreen'
import { BudgetsScreen } from '../screens/BudgetsScreen'
import { ForecastScreen } from '../screens/ForecastScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { AddTransactionScreen } from '../screens/AddTransactionScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'
          
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Transactions':
              iconName = focused ? 'list' : 'list-outline'
              break
            case 'Budgets':
              iconName = focused ? 'wallet' : 'wallet-outline'
              break
            case 'Forecast':
              iconName = focused ? 'trending-up' : 'trending-up-outline'
              break
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline'
              break
          }
          
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Forecast" component={ForecastScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="AddTransaction" 
            component={AddTransactionScreen}
            options={{ headerShown: true, title: 'Add Transaction' }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}
