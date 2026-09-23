import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', date_of_birth: '', gender: '', blood_group: '', address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 py-12">
      <div className="w-full max-w-xl mx-auto px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-8 text-slate-800">
          <HeartPulse className="w-6 h-6 text-brand-600" /> MediCare+
        </Link>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-900">Create your patient account</h1>
          <p className="text-sm text-slate-500 mt-1">Staff accounts (doctors, admin, reception) are created by the hospital administrator.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <ErrorBanner message={error} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name *</label>
                <input required className="input" value={form.name} onChange={update('name')} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={update('phone')} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input type="email" required className="input" value={form.email} onChange={update('email')} />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" required minLength={6} className="input" value={form.password} onChange={update('password')} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Date of birth</label>
                <input type="date" className="input" value={form.date_of_birth} onChange={update('date_of_birth')} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={update('gender')}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Blood group</label>
                <input className="input" placeholder="O+" value={form.blood_group} onChange={update('blood_group')} />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={update('address')} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
              <UserPlus className="w-4 h-4" /> {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
