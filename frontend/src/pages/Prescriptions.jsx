import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, EmptyState, ErrorBanner } from '../components/ui';

const EMPTY_MED = { name: '', dosage: '', frequency: '', duration: '' };

export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/prescriptions').then(({ data }) => setPrescriptions(data.prescriptions)).finally(() => setLoading(false));
    if (user.role === 'doctor') {
      api.get('/patients').then(({ data }) => setPatients(data.patients));
    }
  };

  useEffect(load, []);

  const updateMed = (i, field, value) => {
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };
  const addMed = () => setMedicines((prev) => [...prev, { ...EMPTY_MED }]);
  const removeMed = (i) => setMedicines((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setPatientId('');
    setInstructions('');
    setMedicines([{ ...EMPTY_MED }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/prescriptions', { patient_id: patientId, medicines, instructions });
      setShowForm(false);
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create prescription.');
    } finally {
      setSaving(false);
    }
  };

  const parsedMeds = (rx) => {
    try {
      return JSON.parse(rx.medicines);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {user.role === 'patient' ? 'My Prescriptions' : 'Prescriptions'}
        </h1>
        {user.role === 'doctor' && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Prescription
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : prescriptions.length === 0 ? (
          <EmptyState message="No prescriptions yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4 font-medium">Patient</th>
                <th className="py-3 px-4 font-medium">Doctor</th>
                <th className="py-3 px-4 font-medium">Issued</th>
                <th className="py-3 px-4 font-medium">Medicines</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setViewing(rx)}>
                  <td className="py-3 px-4 font-medium text-slate-700">{rx.patient_name}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.doctor_name}</td>
                  <td className="py-3 px-4 text-slate-500">{rx.issued_date?.slice(0, 10)}</td>
                  <td className="py-3 px-4 text-slate-500">{parsedMeds(rx).map((m) => m.name).join(', ')}</td>
                  <td className="py-3 px-4"><Badge status={rx.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Prescription Details">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Patient</span><span className="font-medium">{viewing.patient_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Doctor</span><span className="font-medium">{viewing.doctor_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Issued</span><span className="font-medium">{viewing.issued_date?.slice(0, 10)}</span></div>
            <div>
              <p className="text-slate-400 mb-2">Medicines</p>
              <div className="space-y-2">
                {parsedMeds(viewing).map((m, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <p className="font-medium text-slate-700">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.dosage} · {m.frequency} · {m.duration}</p>
                  </div>
                ))}
              </div>
            </div>
            {viewing.instructions && (
              <div>
                <p className="text-slate-400 mb-1">Instructions</p>
                <p className="text-slate-700">{viewing.instructions}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Prescription" wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="label">Patient *</label>
            <select required className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Medicines *</label>
              <button type="button" onClick={addMed} className="text-xs text-brand-600 font-semibold hover:underline">+ Add medicine</button>
            </div>
            <div className="space-y-3">
              {medicines.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input required placeholder="Name" className="input col-span-4" value={m.name} onChange={(e) => updateMed(i, 'name', e.target.value)} />
                  <input placeholder="Dosage" className="input col-span-3" value={m.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)} />
                  <input placeholder="Frequency" className="input col-span-3" value={m.frequency} onChange={(e) => updateMed(i, 'frequency', e.target.value)} />
                  <input placeholder="Duration" className="input col-span-2" value={m.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)} />
                  {medicines.length > 1 && (
                    <button type="button" onClick={() => removeMed(i)} className="col-span-12 justify-self-end text-rose-500 text-xs flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Instructions</label>
            <textarea className="input" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Saving...' : 'Issue Prescription'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
