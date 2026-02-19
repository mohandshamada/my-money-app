import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const FORECAST_DAYS = [
  { date: 'Today', balance: 5240, low: 5100, high: 5380 },
  { date: '1 Week', balance: 4850, low: 4600, high: 5100 },
  { date: '1 Month', balance: 6200, low: 5500, high: 6900 },
  { date: '3 Months', balance: 8500, low: 7000, high: 10000 },
]

export function ForecastScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Forecast</Text>
        </View>

        {/* Current Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>$5,240.00</Text>
          <View style={styles.balanceChange}>
            <Ionicons name="trending-up" size={16} color="#10b981" />
            <Text style={styles.changeText}>+12.5% from last month</Text>
          </View>
        </View>

        {/* Forecast Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projected Balance</Text>
          
          {FORECAST_DAYS.map((day, index) => (
            <View key={index} style={styles.forecastRow}>
              <View style={styles.forecastLeft}>
                <View style={[styles.dot, index === 0 && styles.dotActive]} />
                {index !== FORECAST_DAYS.length - 1 && <View style={styles.line} />}
              </View>
              
              <View style={styles.forecastContent}>
                <View style={styles.forecastHeader}>
                  <Text style={styles.forecastDate}>{day.date}</Text>
                  <Text style={styles.forecastBalance}>${day.balance.toLocaleString()}</Text>
                </View>
                
                <View style={styles.confidence}>
                  <Text style={styles.confidenceText}>
                    68% confidence: ${day.low.toLocaleString()} - ${day.high.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* What-If Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What-If Scenarios</Text>
          
          <TouchableOpacity style={styles.scenarioCard}>
            <View style={styles.scenarioLeft}>
              <View style={[styles.scenarioIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="add-circle" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.scenarioTitle}>Create Scenario</Text>
                <Text style={styles.scenarioDesc}>Test different spending patterns</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Forecasts use Monte Carlo simulation based on your historical spending patterns to predict future balances.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  balanceCard: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  changeText: {
    fontSize: 14,
    color: '#86efac',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: 'row',
  },
  forecastLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  dotActive: {
    backgroundColor: '#3b82f6',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  forecastContent: {
    flex: 1,
    paddingBottom: 24,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  forecastBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  confidence: {
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  scenarioCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  scenarioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scenarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  scenarioDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
})
