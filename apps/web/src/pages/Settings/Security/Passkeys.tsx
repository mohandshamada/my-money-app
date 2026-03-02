import React, { useEffect, useState } from 'react';
import { registerPasskey, listPasskeys, deletePasskey } from '../../../services/webauthn';
import { Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

interface Passkey {
  id: string;
  name: string;
  device_type: string;
  created_at: string;
  last_used_at?: string;
}

export const Passkeys: React.FC = () => {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyName, setPasskeyName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchPasskeys = async () => {
    try {
      setLoading(true);
      const data = await listPasskeys();
      setPasskeys(data);
    } catch (err) {
      setError('Failed to load passkeys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    try {
      setLoading(true);
      setError(null);
      await registerPasskey(passkeyName || `Passkey ${passkeys.length + 1}`);
      setPasskeyName('');
      setIsAdding(false);
      await fetchPasskeys();
    } catch (err) {
      setError('Failed to register passkey. Make sure your device supports it.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this passkey?')) return;
    try {
      await deletePasskey(id);
      setPasskeys(passkeys.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete passkey');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Passkeys
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {isAdding ? 'Cancel' : 'Add New'}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Passkeys are a safer and easier replacement for passwords. With passkeys, you can sign in to your account using your face, fingerprint, or screen lock.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isAdding && (
        <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Name your passkey (e.g. MacBook Pro)"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
          <button
            onClick={handleAddPasskey}
            disabled={loading}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      <div className="space-y-3">
        {passkeys.length === 0 && !loading ? (
          <div className="text-center py-6 text-gray-400 text-sm italic">
            No passkeys setup yet.
          </div>
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {pk.name}
                </span>
                <span className="text-xs text-gray-500">
                  Added {new Date(pk.created_at).toLocaleDateString()} • {pk.device_type || 'Unknown device'}
                </span>
              </div>
              <button
                onClick={() => handleDelete(pk.id)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                title="Remove passkey"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
