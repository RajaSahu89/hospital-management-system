import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, EmptyState, ErrorBanner } from '../components/ui';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canBookForOthers = ['admin', 'receptionist'].includes(user.role);
  const canManageStatus = ['admin', 'doctor', 'receptionist'].includes(user.role);

  const load = () => {
    setLoading(true);
    api.get('/appointments').then(({ data }) => setAppointments(data.appointments)).finally(() => setLoading(false));
    api.get('/doctors').then(({ data }) => setDoctors(data.doctors));
    if (canBookForOthers) {
      api.get('/patients').then(({ data }) => setPatients(data.patients));
    }
  };

  useEffect(load, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/appointments', form);
      setShowForm(false);
      setForm({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const cancelAppt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    await updateStatus(id, 'cancelled');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {user.role === 'patient' ? 'My Appointments' : 'Appointments'}
        </h1>
        {(user.role === 'patient' || canBookForOthers) && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : appointments.length === 0 ? (
          <EmptyState message="No appointments yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4 font-medium">Patient</th>
                <th className="py-3 px-4 font-medium">Doctor</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Time</th>
                <th className="py-3 px-4 font-medium">Reason</th>
                <th className="py-3 px-4 font-medium">Status</th>
                {canManageStatus && <th className="py-3 px-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-700">{a.patient_name}</td>
                  <td className="py-3 px-4 text-slate-600">{a.doctor_name}</td>
                  <td className="py-3 px-4 text-slate-500">{a.appointment_date}</td>
                  <td className="py-3 px-4 text-slate-500">{a.appointment_time}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{a.reason || '—'}</td>
                  <td className="py-3 px-4"><Badge status={a.status} /></td>
                  {canManageStatus && (
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2 items-center">
                        <select
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                          value={a.status}
                          onChange={(e) => updateStatus(a.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  )}
                  {!canManageStatus && a.status !== 'cancelled' && a.status !== 'completed' && (
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => cancelAppt(a.id)} className="text-xs text-rose-600 hover:underline">
                        Cancel
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Book an Appointment">
        <form onSubmit={handleBook} className="space-y-4">
          <ErrorBanner message={error} />
          {canBookForOthers && (
            <div>
              <label className="label">Patient *</label>
              <select required className="input" value={form.patient_id} onChange={update('patient_id')}>
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Doctor *</label>
            <select required className="input" value={form.doctor_id} onChange={update('doctor_id')}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" required className="input" value={form.appointment_date} onChange={update('appointment_date')} />
            </div>
            <div>
              <label className="label">Time *</label>
              <input type="time" required className="input" value={form.appointment_time} onChange={update('appointment_time')} />
            </div>
          </div>
          <div>
            <label className="label">Reason for visit</label>
            <textarea className="input" rows={3} value={form.reason} onChange={update('reason')} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5">
            {saving ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
