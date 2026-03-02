import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch } from 'react-redux'
import { createTransaction, fetchTransactions } from '../store/transactionSlice'

const CATEGORIES = [
  { id: 'income', label: 'Income', icon: 'arrow-down', color: '#10b981' },
  { id: 'food', label: 'Food & Dining', icon: 'restaurant', color: '#f59e0b' },
  { id: 'transport', label: 'Transportation', icon: 'car', color: '#3b82f6' },
  { id: 'shopping', label: 'Shopping', icon: 'cart', color: '#ec4899' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film', color: '#8b5cf6' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt', color: '#ef4444' },
  { id: 'health', label: 'Healthcare', icon: 'medical', color: '#06b6d4' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6b7280' },
]

export function AddTransactionScreen({ navigation }: any) {
  const dispatch = useDispatch()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isExpense, setIsExpense] = useState(true)
  const [category, setCategory] = useState('food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!amount || !description) return

    setLoading(true)
    
    try {
      await dispatch(createTransaction({
        amount: parseFloat(amount),
        isExpense,
        description,
        category: CATEGORIES.find(c => c.id === category)?.label || 'Other',
        date: new Date(date).toISOString(),
        pending: false,
      }) as any)
      
      dispatch(fetchTransactions() as any)
      navigation.goBack()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Type Toggle */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(true)}
          >
            <Text style={[styles.typeText, isExpense && styles.typeTextActive]}>Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(false)}
          >
            <Text style={[styles.typeText, !isExpense && styles.typeTextActive]}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="What was this for?"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.filter(c => isExpense ? c.id !== 'income' : c.id === 'income').map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <Text style={[styles.categoryText, category === cat.id && { color: cat.color }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Pending Toggle */}
        <View style={styles.pendingRow}>
          <Text style={styles.label}>Pending Transaction</Text>
          <Switch
            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (!amount || !description) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!amount || !description || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeTextActive: {
    color: '#111827',
  },
  amountContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 48,
    fontWeight: '300',
    color: '#111827',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '300',
    color: '#111827',
  },
  field: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#374151',
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
