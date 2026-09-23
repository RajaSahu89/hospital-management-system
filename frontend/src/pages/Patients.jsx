import React, { useEffect, useState } from 'react';
import { Search, Trash2, Eye } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, EmptyState, ErrorBanner } from '../components/ui';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/patients')
      .then(({ data }) => setPatients(data.patients))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load patients.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient record permanently?')) return;
    try {
      await api.delete(`/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete patient.');
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-9" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No patients found." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Phone</th>
                <th className="py-3 px-4 font-medium">Blood Group</th>
                <th className="py-3 px-4 font-medium">Gender</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-700">{p.name}</td>
                  <td className="py-3 px-4 text-slate-500">{p.email}</td>
                  <td className="py-3 px-4 text-slate-500">{p.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{p.blood_group || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{p.gender || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelected(p)} className="text-slate-400 hover:text-brand-600" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.role === 'admin' && (
                        <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Patient Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Name" value={selected.name} />
            <Row label="Email" value={selected.email} />
            <Row label="Phone" value={selected.phone} />
            <Row label="Date of Birth" value={selected.date_of_birth} />
            <Row label="Gender" value={selected.gender} />
            <Row label="Blood Group" value={selected.blood_group} />
            <Row label="Address" value={selected.address} />
            <Row label="Emergency Contact" value={selected.emergency_contact} />
            <Row label="Allergies" value={selected.allergies} />
            <Row label="Chronic Conditions" value={selected.chronic_conditions} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-50 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value || '—'}</span>
    </div>
  );
}
