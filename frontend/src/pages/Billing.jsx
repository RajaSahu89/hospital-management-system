import React, { useEffect, useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, EmptyState, ErrorBanner } from '../components/ui';

export default function Billing() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', description: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canCreate = ['admin', 'receptionist'].includes(user.role);

  const load = () => {
    setLoading(true);
    api.get('/billing').then(({ data }) => setBills(data.bills)).finally(() => setLoading(false));
    if (canCreate) {
      api.get('/patients').then(({ data }) => setPatients(data.patients));
    }
  };

  useEffect(load, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/billing', form);
      setShowForm(false);
      setForm({ patient_id: '', description: '', amount: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  const payBill = async (id) => {
    try {
      await api.put(`/billing/${id}/pay`, { payment_method: 'card' });
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'paid' } : b)));
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed.');
    }
  };

  const totalOutstanding = bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{user.role === 'patient' ? 'My Bills' : 'Billing'}</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Bill
          </button>
        )}
      </div>

      {user.role === 'patient' && totalOutstanding > 0 && (
        <div className="card p-4 bg-rose-50 border-rose-200 text-rose-700 text-sm font-medium">
          You have ₹{totalOutstanding.toLocaleString()} in outstanding bills.
        </div>
      )}

      <ErrorBanner message={error} />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : bills.length === 0 ? (
          <EmptyState message="No bills yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                {user.role !== 'patient' && <th className="py-3 px-4 font-medium">Patient</th>}
                <th className="py-3 px-4 font-medium">Description</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Issued</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  {user.role !== 'patient' && <td className="py-3 px-4 font-medium text-slate-700">{b.patient_name}</td>}
                  <td className="py-3 px-4 text-slate-600">{b.description}</td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">₹{b.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-500">{b.issued_date?.slice(0, 10)}</td>
                  <td className="py-3 px-4"><Badge status={b.status} /></td>
                  <td className="py-3 px-4 text-right">
                    {b.status === 'unpaid' && (
                      <button onClick={() => payBill(b.id)} className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline">
                        <CreditCard className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Bill">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="label">Patient *</label>
            <select required className="input" value={form.patient_id} onChange={update('patient_id')}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description *</label>
            <input required className="input" placeholder="Consultation fee, lab test, etc." value={form.description} onChange={update('description')} />
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input required type="number" min="0" step="0.01" className="input" value={form.amount} onChange={update('amount')} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Creating...' : 'Create Bill'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
