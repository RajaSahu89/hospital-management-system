import React, { useEffect, useState } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, EmptyState, ErrorBanner } from '../components/ui';

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '', specialization: '', qualification: '',
  experience_years: '', consultation_fee: '', department: '', available_days: '', available_time: '', bio: '',
};

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/doctors')
      .then(({ data }) => setDoctors(data.doctors))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load doctors.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/doctors', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add doctor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this doctor permanently?')) return;
    try {
      await api.delete(`/doctors/${id}`);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove doctor.');
    }
  };

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input !pl-9" placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {user.role === 'admin' && (
            <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
              <Plus className="w-4 h-4" /> Add Doctor
            </button>
          )}
        </div>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="text-center text-sm text-slate-400 py-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState message="No doctors found." /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  {d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                {user.role === 'admin' && (
                  <button onClick={() => handleDelete(d.id)} className="text-slate-300 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-slate-800">{d.name}</h3>
              <p className="text-sm text-brand-600">{d.specialization}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>{d.qualification} · {d.experience_years}+ yrs experience</p>
                <p>{d.department}</p>
                <p>{d.available_days} · {d.available_time}</p>
                <p>Fee: ₹{d.consultation_fee}</p>
                <p className="truncate">{d.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add New Doctor" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBanner message={error} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full name *</label><input required className="input" value={form.name} onChange={update('name')} /></div>
            <div><label className="label">Email *</label><input type="email" required className="input" value={form.email} onChange={update('email')} /></div>
            <div><label className="label">Password *</label><input type="password" required minLength={6} className="input" value={form.password} onChange={update('password')} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={update('phone')} /></div>
            <div><label className="label">Specialization *</label><input required className="input" value={form.specialization} onChange={update('specialization')} /></div>
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={update('department')} /></div>
            <div><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={update('qualification')} /></div>
            <div><label className="label">Experience (years)</label><input type="number" className="input" value={form.experience_years} onChange={update('experience_years')} /></div>
            <div><label className="label">Consultation fee (₹)</label><input type="number" className="input" value={form.consultation_fee} onChange={update('consultation_fee')} /></div>
            <div><label className="label">Available days</label><input className="input" placeholder="Mon,Tue,Wed" value={form.available_days} onChange={update('available_days')} /></div>
            <div className="sm:col-span-2"><label className="label">Available time</label><input className="input" placeholder="10:00-17:00" value={form.available_time} onChange={update('available_time')} /></div>
            <div className="sm:col-span-2"><label className="label">Bio</label><textarea className="input" rows={3} value={form.bio} onChange={update('bio')} /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Adding...' : 'Add Doctor'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
