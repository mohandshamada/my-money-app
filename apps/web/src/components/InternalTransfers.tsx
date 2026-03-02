import { useState } from 'react';
import { RefreshCw, Check, ArrowRight } from 'lucide-react';

interface TransferPair {
  expense: {
    id: string;
    amount: number;
    date: string;
    merchant: string;
    description: string;
  };
  income: {
    id: string;
    amount: number;
    date: string;
    merchant: string;
    description: string;
  };
  amount: number;
  dateDiff: number;
}

export function InternalTransfers({ onComplete }: { onComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<TransferPair[]>([]);
  const [scanned, setScanned] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  const scanTransfers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/transactions/find-transfers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPairs(data.pairs || []);
      }
    } catch (err) {
      console.error('Failed to scan for transfers:', err);
    } finally {
      setLoading(false);
      setScanned(true);
    }
  };

  const confirmTransfers = async () => {
    if (pairs.length === 0) return;
    
    setConfirming(true);
    try {
      // Collect all IDs
      const transactionIds = pairs.flatMap(p => [p.expense.id, p.income.id]);
      
      const token = localStorage.getItem('token');
      const res = await fetch('/api/transactions/confirm-transfers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ transactionIds })
      });
      
      if (res.ok) {
        setPairs([]);
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error('Failed to confirm transfers:', err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Find Internal Transfers
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Automatically detect and link transfers between your own accounts to keep your income/expense reports accurate.
          </p>
        </div>
        {!scanned && (
          <button 
            onClick={scanTransfers} 
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            {loading ? <span className="animate-spin">⏳</span> : <RefreshCw className="h-4 w-4" />}
            Scan Transactions
          </button>
        )}
      </div>

      {scanned && pairs.length === 0 && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <p>No new unmatched transfers found. Your transactions are clean!</p>
        </div>
      )}

      {scanned && pairs.length > 0 && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800 font-medium">
              Found {pairs.length} potential transfer {pairs.length === 1 ? 'pair' : 'pairs'}.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Confirming these will categorize them as "Internal Transfer" so they don't artificially inflate your income and expenses.
            </p>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50">
            {pairs.map((pair, idx) => (
              <div key={idx} className="bg-white p-3 rounded shadow-sm border flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-1">
                    <span>Withdrawal: ${pair.amount.toFixed(2)}</span>
                    <span className="text-gray-500 font-normal">({new Date(pair.expense.date).toLocaleDateString()})</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{pair.expense.merchant || pair.expense.description}</p>
                </div>
                
                <div className="px-4 text-gray-400">
                  <ArrowRight className="h-5 w-5" />
                </div>
                
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-green-600 font-medium mb-1">
                    <span className="text-gray-500 font-normal">({new Date(pair.income.date).toLocaleDateString()})</span>
                    <span>Deposit: ${pair.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{pair.income.merchant || pair.income.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={confirmTransfers} 
              disabled={confirming}
              className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {confirming ? <span className="animate-spin">⏳</span> : <Check className="h-4 w-4" />}
              Confirm & Link All Transfers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
