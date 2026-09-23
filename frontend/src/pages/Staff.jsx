import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, EmptyState, ErrorBanner } from '../components/ui';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'receptionist', phone: '' };

export default function Staff() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users').then(({ data }) => setUsers(data.users)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Staff Accounts</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : users.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Phone</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-700">{u.name}</td>
                  <td className="py-3 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3 px-4 text-slate-500 capitalize">{u.role}</td>
                  <td className="py-3 px-4 text-slate-500">{u.phone || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    {u.id !== currentUser.id && (
                      <button onClick={() => handleDelete(u.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Staff Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBanner message={error} />
          <div><label className="label">Full name *</label><input required className="input" value={form.name} onChange={update('name')} /></div>
          <div><label className="label">Email *</label><input type="email" required className="input" value={form.email} onChange={update('email')} /></div>
          <div><label className="label">Password *</label><input type="password" required minLength={6} className="input" value={form.password} onChange={update('password')} /></div>
          <div>
            <label className="label">Role *</label>
            <select required className="input" value={form.role} onChange={update('role')}>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={update('phone')} /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
