import { useState, useEffect } from 'react';
import { Users, CreditCard, Wallet, DollarSign, Search, RefreshCw, Edit2, Shield, Trash2, ShieldAlert, Activity, Server, Database, Terminal, X, UserCheck, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface User { id: string; email: string; name: string; tier: string; role: string; transactionCount: number; created_at: string; }
interface Stats { totalUsers: number; totalTransactions: number; totalAccounts: number; monthlyRevenue: number; usersByTier: { tier: string; count: number }[]; }
interface SystemMetrics { database: { size: string; users: number; transactions: number; subscriptions: number }; activity: { newUsersToday: number; newTransactionsToday: number; timestamp: string }; server: { uptime: number; memory: any; nodeVersion: string; platform: string }; }
interface LogEntry { timestamp: string; action: string; user: string; details: string; }

export function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [activeTab, setActiveTab] = useState('users');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const token = localStorage.getItem('token');

  useEffect(() => { 
    fetch(API_URL + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => setIsAdmin(d.user?.role === 'admin' || d.user?.email?.includes('admin')))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => { 
    if (!isAdmin) return;
    fetch(API_URL + '/api/admin/stats', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(setStats);
    fetchUsers(1);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'system') return;
    const load = () => {
      fetch(API_URL + '/api/admin/metrics', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json()).then(setMetrics);
      fetch(API_URL + '/api/admin/logs', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json()).then(d => setLogs(d.logs));
    };
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, [isAdmin, activeTab]);

  const fetchUsers = (page: number) => {
    fetch(API_URL + '/api/admin/users?page=' + page + '&search=' + searchQuery, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setPagination(d.pagination || { page: 1, pages: 1 }); }).catch(e => { console.error(e); setUsers([]); });
  };

  const updateTier = (userId: string, tier: string) => {
    fetch(API_URL + '/api/admin/users/' + userId + '/tier', {
      method: 'PUT', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier })
    }).then(() => { fetchUsers(pagination.page); setEditingUser(null); });
  };

  const deleteUser = (userId: string) => {
    if (!confirm('Delete this user?')) return;
    fetch(API_URL + '/api/admin/users/' + userId, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
      .then(() => fetchUsers(pagination.page));
  };

  const toggleRole = (userId: string, current: string) => {
    const newRole = current === 'admin' ? 'user' : 'admin';
    if (!confirm('Change role to ' + newRole + '?')) return;
    fetch(API_URL + '/api/admin/users/' + userId + '/role', {
      method: 'PUT', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    }).then(() => fetchUsers(pagination.page));
  };

  const impersonateUser = (userId: string) => {
    if (!confirm('Are you sure you want to login as this user?')) return;
    fetch(API_URL + '/api/admin/users/' + userId + '/impersonate', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(d => {
        if (d.token) {
          localStorage.setItem('token', d.token);
          window.location.href = '/dashboard';
        } else {
          alert('Failed to impersonate user');
        }
      });
  };

  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600">No permission.</p>
      </div>
    </div>
  );

  const formatTime = (s: number) => {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d + 'd ' + h + 'h ' + m + 'm';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={() => window.location.href = '/dashboard'} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Users</p><p className="text-2xl font-bold">{stats?.totalUsers || 0}</p></div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Transactions</p><p className="text-2xl font-bold">{stats?.totalTransactions?.toLocaleString() || 0}</p></div>
            <CreditCard className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Accounts</p><p className="text-2xl font-bold">{stats?.totalAccounts || 0}</p></div>
            <Wallet className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Monthly Revenue</p><p className="text-2xl font-bold">${stats?.monthlyRevenue || 0}</p></div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b flex">
          <button onClick={() => setActiveTab('users')} className={'px-6 py-4 font-medium ' + (activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600')}>
            <Users className="h-5 w-5 inline mr-2" />Users
          </button>
          <button onClick={() => setActiveTab('system')} className={'px-6 py-4 font-medium ' + (activeTab === 'system' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600')}>
            <Server className="h-5 w-5 inline mr-2" />System
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Users</h2>
              <button onClick={() => { fetchUsers(pagination.page); }} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className="h-5 w-5" /></button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && fetchUsers(1)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">User</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Tier/Role</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Tx</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(users || []).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div><p className="font-medium">{user.name || 'N/A'}</p><p className="text-sm text-gray-500">{user.email}</p></div></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (user.tier === 'premium' ? 'bg-purple-100 text-purple-700' : user.tier === 'standard' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>{user.tier}</span>
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>{user.role || 'user'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{user.transactionCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-800" title="Edit Tier"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => toggleRole(user.id, user.role || 'user')} className="text-orange-600 hover:text-orange-800" title="Toggle Role"><ShieldAlert className="h-4 w-4" /></button>
                          <button onClick={() => impersonateUser(user.id)} className="text-purple-600 hover:text-purple-800" title="Impersonate (Login as this user)"><UserCheck className="h-4 w-4" /></button>
                          <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50">Previous</button>
                  <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-3 py-1 border rounded-lg disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">System Health</h2>
            </div>
            {metrics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2"><Database className="h-5 w-5 text-blue-600" /><span className="font-medium">Database</span></div>
                    <p className="text-sm text-gray-600">Size: {metrics.database.size}</p>
                    <p className="text-sm text-gray-600">Users: {metrics.database.users.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Transactions: {metrics.database.transactions.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2"><Activity className="h-5 w-5 text-green-600" /><span className="font-medium">Today's Activity</span></div>
                    <p className="text-sm text-gray-600\">New Users: {metrics.activity.newUsersToday}</p>
                    <p className="text-sm text-gray-600">New Transactions: {metrics.activity.newTransactionsToday}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2"><Server className="h-5 w-5 text-purple-600" /><span className="font-medium">Server</span></div>
                    <p className="text-sm text-gray-600">Uptime: {formatTime(metrics.server.uptime)}</p>
                    <p className="text-sm text-gray-600">Memory: {Math.round(metrics.server.memory.heapUsed / 1024 / 1024)}MB</p>
                    <p className="text-sm text-gray-600">Node: {metrics.server.nodeVersion}</p>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4"><Terminal className="h-5 w-5 text-green-400" /><span className="font-medium text-white">Recent Activity Logs</span></div>
                  <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? <p className="text-gray-400">No recent activity</p> : logs.map((log, i) => (
                      <div key={i} className="text-gray-300 border-l-2 border-green-500 pl-3">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-blue-400 ml-2">{log.user}</span>
                        <span className="text-yellow-400 ml-2">{log.action}</span>
                        <span className="text-gray-400 ml-2">{log.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : <div className="text-center py-12 text-gray-500">Loading...</div>}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit User Tier</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-gray-600 mb-4">{editingUser.email}</p>
            <div className="space-y-2 mb-6">
              {['free', 'standard', 'premium'].map((tier) => (
                <label key={tier} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="tier" value={tier} checked={editingUser.tier === tier} onChange={() => setEditingUser({ ...editingUser, tier })} className="w-4 h-4" />
                  <span className="capitalize font-medium">{tier}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => updateTier(editingUser.id, editingUser.tier)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
