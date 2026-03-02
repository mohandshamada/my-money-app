import { useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { RootState } from '../store'
import { fetchTransactions } from '../store/transactionSlice'

export function TransactionsScreen({ navigation }: any) {
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state: RootState) => state.transactions)

  useEffect(() => {
    dispatch(fetchTransactions() as any)
  }, [dispatch])

  const onRefresh = () => {
    dispatch(fetchTransactions() as any)
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.leftContent}>
        <View style={[styles.icon, { backgroundColor: item.isExpense ? '#fee2e2' : '#dcfce7' }]}>
          <Ionicons 
            name={item.isExpense ? 'arrow-up' : 'arrow-down'} 
            size={16} 
            color={item.isExpense ? '#ef4444' : '#10b981'} 
          />
        </View>
        <View>
          <Text style={styles.title}>{item.merchant || item.category}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{item.category}</Text>
            {item.pending && <Text style={styles.pending}> • Pending</Text>}
          </View>
        </View>
      </View>
      
      <Text style={[styles.amount, { color: item.isExpense ? '#ef4444' : '#10b981' }]}>
        {item.isExpense ? '-' : '+'}${item.amount.toFixed(2)}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Text style={styles.emptyButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  headerTitle: {
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
  list: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
  },
  pending: {
    fontSize: 12,
    color: '#f59e0b',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
