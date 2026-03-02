import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithPasskey } from '../../store/authSlice';
import { Fingerprint } from 'lucide-react';
import { AppDispatch, RootState } from '../../store';

interface PasskeyButtonProps {
  className?: string;
}

export const PasskeyButton: React.FC<PasskeyButtonProps> = ({ className }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading: loading } = useSelector((state: RootState) => state.auth);

  const handlePasskeyLogin = async () => {
    try {
      await dispatch(loginWithPasskey()).unwrap();
    } catch (err) {
      console.error('Passkey login failed:', err);
      // Error is handled in redux state
    }
  };

  return (
    <button
      onClick={handlePasskeyLogin}
      disabled={loading}
      className={`flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Fingerprint className="w-5 h-5" />
      {loading ? 'Authenticating...' : 'Sign in with Passkey'}
    </button>
  );
};
