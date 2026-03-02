import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const BUDGETS = [
  { id: '1', category: 'Food & Dining', budgeted: 500, spent: 420, icon: 'restaurant' },
  { id: '2', category: 'Transportation', budgeted: 300, spent: 180, icon: 'car' },
  { id: '3', category: 'Entertainment', budgeted: 200, spent: 250, icon: 'film' },
  { id: '4', category: 'Shopping', budgeted: 400, spent: 150, icon: 'cart' },
]

export function BudgetsScreen() {
  const [period, setPeriod] = useState('month')

  const totalBudgeted = BUDGETS.reduce((sum, b) => sum + b.budgeted, 0)
  const totalSpent = BUDGETS.reduce((sum, b) => sum + b.spent, 0)

  const getProgress = (spent: number, budgeted: number): { color: string; width: any } => {
    const ratio = spent / budgeted
    if (ratio >= 1) return { color: '#ef4444', width: '100%' }
    if (ratio >= 0.8) return { color: '#f59e0b', width: `${ratio * 100}%` }
    return { color: '#10b981', width: `${ratio * 100}%` }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Budgets</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Monthly Budget</Text>
            <View style={styles.periodSelector}>
              {['week', 'month', 'year'].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[styles.periodButton, period === p && styles.periodActive]}
                >
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>${totalSpent}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>Budgeted</Text>
              <Text style={styles.summaryValue}>${totalBudgeted}</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
                  backgroundColor: totalSpent > totalBudgeted ? '#ef4444' : '#3b82f6'
                }
              ]} 
            />
          </View>

          <Text style={styles.remaining}>
            ${totalBudgeted - totalSpent} remaining
          </Text>
        </View>

        {/* Budget List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          
          {BUDGETS.map((budget) => {
            const progress = getProgress(budget.spent, budget.budgeted)
            const isOver = budget.spent > budget.budgeted

            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetLeft}>
                    <View style={[styles.budgetIcon, { backgroundColor: progress.color + '20' }]}>
                      <Ionicons name={budget.icon as any} size={20} color={progress.color} />
                    </View>
                    <View>
                      <Text style={styles.budgetName}>{budget.category}</Text>
                      <Text style={styles.budgetMeta}>
                        ${budget.spent} of ${budget.budgeted}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.budgetBadge, { backgroundColor: isOver ? '#fee2e2' : '#dcfce7' }]}>
                    <Text style={[styles.budgetBadgeText, { color: isOver ? '#dc2626' : '#16a34a' }]}>
                      {isOver ? 'Over' : 'On Track'}
                    </Text>
                  </View>
                </View>

                <View style={styles.budgetProgress}>
                  <View style={[styles.budgetProgressFill, { width: progress.width, backgroundColor: progress.color }]} />
                </View>
              </View>
            )
          })}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  periodText: {
    fontSize: 12,
    color: '#6b7280',
  },
  periodTextActive: {
    color: '#111827',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remaining: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  budgetCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  budgetMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  budgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  budgetBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetProgress: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
})
