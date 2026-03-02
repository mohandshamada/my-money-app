import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, RefreshCw } from 'lucide-react';

interface Rule {
  id: string;
  match_field: string;
  match_type: string;
  match_value: string;
  category: string;
  subcategory?: string;
  priority: number;
}

export function RulesEngine() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    match_field: 'merchant',
    match_type: 'contains',
    match_value: '',
    category: '',
    subcategory: '',
    priority: 0
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newRule)
      });
      if (res.ok) {
        setShowForm(false);
        setNewRule({
          match_field: 'merchant',
          match_type: 'contains',
          match_value: '',
          category: '',
          subcategory: '',
          priority: 0
        });
        fetchRules();
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const applyRules = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/rules/apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplyResult(`Success! Updated ${data.updatedCount} existing transactions.`);
        setTimeout(() => setApplyResult(null), 5000);
      } else {
        setApplyResult('Failed to apply rules.');
      }
    } catch (err) {
      console.error('Failed to apply rules:', err);
      setApplyResult('Failed to apply rules.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-4">Loading rules...</div>;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Auto-Categorization Rules</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyRules}
            disabled={applying || rules.length === 0}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${applying ? 'animate-spin' : ''}`} />
            Apply to Past Transactions
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Create rules to automatically categorize transactions based on merchant name or description.
        Rules are applied before AI categorization.
      </p>

      {applyResult && (
        <div className={`p-4 mb-4 rounded-lg ${applyResult.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {applyResult}
        </div>
      )}

      {showForm && (
        <form onSubmit={createRule} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Match Field</label>
              <select
                value={newRule.match_field}
                onChange={(e) => setNewRule({ ...newRule, match_field: e.target.value })}
                className="w-full input"
              >
                <option value="merchant">Merchant</option>
                <option value="description">Description</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Match Type</label>
              <select
                value={newRule.match_type}
                onChange={(e) => setNewRule({ ...newRule, match_type: e.target.value })}
                className="w-full input"
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact Match</option>
                <option value="starts_with">Starts With</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Match Value</label>
            <input
              type="text"
              value={newRule.match_value}
              onChange={(e) => setNewRule({ ...newRule, match_value: e.target.value })}
              placeholder="e.g., Uber, Netflix, Shell"
              className="w-full input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                placeholder="e.g., Transport"
                className="w-full input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subcategory (optional)</label>
              <input
                type="text"
                value={newRule.subcategory}
                onChange={(e) => setNewRule({ ...newRule, subcategory: e.target.value })}
                placeholder="e.g., Rideshare"
                className="w-full input"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Create Rule</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No rules yet. Create one to get started!</p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {rule.match_field} {rule.match_type} "{rule.match_value}"
                </p>
                <p className="text-sm text-gray-600">
                  → {rule.category}
                  {rule.subcategory && ` / ${rule.subcategory}`}
                </p>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
