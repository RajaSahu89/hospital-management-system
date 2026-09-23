import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ui';

const DEMO_LOGINS = [
  { role: 'Admin', email: 'admin@hms.com', password: 'Admin@123' },
  { role: 'Doctor', email: 'ananya.roy@hms.com', password: 'Doctor@123' },
  { role: 'Receptionist', email: 'reception@hms.com', password: 'Reception@123' },
  { role: 'Patient', email: 'patient@hms.com', password: 'Patient@123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/app';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center px-6 py-12">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-10 text-slate-800">
          <HeartPulse className="w-6 h-6 text-brand-600" /> MediCare+
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Log in to access your dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
            <LogIn className="w-4 h-4" /> {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New patient?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create an account</Link>
        </p>

        <div className="mt-10 card p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Demo logins (after seeding the database)</p>
          <div className="space-y-1.5 text-xs text-slate-600">
            {DEMO_LOGINS.map((d) => (
              <div key={d.email} className="flex justify-between">
                <span className="font-medium">{d.role}</span>
                <span className="font-mono">{d.email} / {d.password}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
