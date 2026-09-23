import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, EmptyState, ErrorBanner } from '../components/ui';

const EMPTY_FORM = { patient_id: '', diagnosis: '', symptoms: '', treatment: '', vitals: '', notes: '' };

export default function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const canCreate = ['doctor', 'admin'].includes(user.role);

  const load = () => {
    setLoading(true);
    api.get('/records').then(({ data }) => setRecords(data.records)).catch((err) => setError(err.response?.data?.error || 'Failed to load records.')).finally(() => setLoading(false));
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
      await api.post('/records', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{user.role === 'patient' ? 'My Medical Records' : 'Medical Records'}</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Record
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : records.length === 0 ? (
          <EmptyState message="No medical records yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                {user.role !== 'patient' && <th className="py-3 px-4 font-medium">Patient</th>}
                <th className="py-3 px-4 font-medium">Doctor</th>
                <th className="py-3 px-4 font-medium">Diagnosis</th>
                <th className="py-3 px-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setViewing(r)}>
                  {user.role !== 'patient' && <td className="py-3 px-4 font-medium text-slate-700">{r.patient_name}</td>}
                  <td className="py-3 px-4 text-slate-600">{r.doctor_name || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{r.diagnosis}</td>
                  <td className="py-3 px-4 text-slate-500">{r.record_date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Medical Record">
        {viewing && (
          <div className="space-y-3 text-sm">
            <Row label="Patient" value={viewing.patient_name} />
            <Row label="Doctor" value={viewing.doctor_name} />
            <Row label="Date" value={viewing.record_date?.slice(0, 10)} />
            <Row label="Diagnosis" value={viewing.diagnosis} />
            <Row label="Symptoms" value={viewing.symptoms} />
            <Row label="Treatment" value={viewing.treatment} />
            <Row label="Vitals" value={viewing.vitals} />
            <Row label="Notes" value={viewing.notes} />
          </div>
        )}
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Medical Record" wide>
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
            <label className="label">Diagnosis *</label>
            <input required className="input" value={form.diagnosis} onChange={update('diagnosis')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Symptoms</label><textarea className="input" rows={2} value={form.symptoms} onChange={update('symptoms')} /></div>
            <div><label className="label">Treatment</label><textarea className="input" rows={2} value={form.treatment} onChange={update('treatment')} /></div>
          </div>
          <div><label className="label">Vitals</label><input className="input" placeholder="BP 120/80, Temp 98.6F, Pulse 72" value={form.vitals} onChange={update('vitals')} /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={update('notes')} /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 pb-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value || '—'}</span>
    </div>
  );
}
