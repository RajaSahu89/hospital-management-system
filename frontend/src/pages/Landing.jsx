import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, CalendarCheck, Stethoscope, ShieldCheck, Bot, Clock,
  ArrowRight, Menu, X, Star,
} from 'lucide-react';
import api from '../api/client';

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Smart Appointment Booking',
    desc: 'Book, reschedule, and track appointments across every department in seconds, with real-time status updates.',
  },
  {
    icon: Stethoscope,
    title: 'Role-Based Dashboards',
    desc: 'Purpose-built dashboards for admins, doctors, receptionists, and patients — everyone sees exactly what they need.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Medical Records',
    desc: 'Diagnoses, prescriptions, and history are encrypted at rest and only ever visible to the right people.',
  },
  {
    icon: Bot,
    title: 'AI Health Assistant',
    desc: 'An always-on assistant to help patients navigate bookings, billing, prescriptions, and basic triage guidance.',
  },
  {
    icon: Clock,
    title: '24/7 Emergency Support',
    desc: 'Round-the-clock emergency care coordination alongside scheduled outpatient consultations.',
  },
  {
    icon: HeartPulse,
    title: 'Integrated Billing',
    desc: 'Transparent, itemized billing tied directly to appointments and treatments — no surprises.',
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    api
      .get('/doctors')
      .then(({ data }) => setDoctors(data.doctors.slice(0, 3)))
      .catch(() => setDoctors([]));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <HeartPulse className="w-6 h-6 text-brand-600" />
            MediCare+
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#doctors" className="hover:text-brand-600">Doctors</a>
            <a href="#about" className="hover:text-brand-600">About</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-secondary">Log in</Link>
            <Link to="/register" className="btn-primary">Book an Appointment</Link>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#doctors" onClick={() => setMenuOpen(false)}>Doctors</a>
            <Link to="/login" className="btn-secondary w-full">Log in</Link>
            <Link to="/register" className="btn-primary w-full">Book an Appointment</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white/10 text-brand-100 text-xs font-semibold px-3 py-1 rounded-full mb-6">
              <Bot className="w-3.5 h-3.5" /> Now with an AI Health Assistant
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Hospital care, organized around <span className="text-teal-400">you</span>.
            </h1>
            <p className="mt-6 text-lg text-brand-100 max-w-xl">
              MediCare+ brings patients, doctors, appointments, prescriptions, billing, and medical
              records into one secure platform — with role-based dashboards for every part of your
              care team.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary bg-teal-500 hover:bg-teal-600 !px-6 !py-3 text-base">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 !py-3 text-base">
                Staff / Doctor Login
              </Link>
            </div>
            <div className="mt-10 flex gap-8 text-sm text-brand-200">
              <div><p className="text-2xl font-bold text-white">50+</p>Specialist doctors</div>
              <div><p className="text-2xl font-bold text-white">24/7</p>Emergency care</div>
              <div><p className="text-2xl font-bold text-white">10k+</p>Patients served</div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="card !bg-white/95 p-6 rounded-2xl shadow-2xl max-w-sm ml-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">MediCare+ Assistant</p>
                  <p className="text-xs text-emerald-600">● Online</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3 py-2 text-slate-700 w-fit">
                  I've had a fever and sore throat for 2 days.
                </div>
                <div className="bg-brand-600 text-white rounded-xl rounded-br-sm px-3 py-2 ml-auto w-fit max-w-[85%]">
                  That sounds like a General Medicine visit. Want me to check today's availability?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900">Everything your hospital needs, in one place</h2>
          <p className="mt-4 text-slate-500">
            Built for administrators, clinicians, front-desk staff, and patients alike.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900">Meet a few of our specialists</h2>
            <p className="mt-4 text-slate-500">Qualified doctors across cardiology, orthopedics, pediatrics and more.</p>
          </div>
          {doctors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div key={doc.id} className="card p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto text-xl font-bold">
                    {doc.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-800">{doc.name}</h3>
                  <p className="text-sm text-brand-600">{doc.specialization}</p>
                  <p className="mt-2 text-xs text-slate-500">{doc.experience_years}+ years experience</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400">Doctor listings will appear here once the API is running.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Ready to modernize your hospital operations?</h2>
        <p className="mt-4 text-slate-500 max-w-xl mx-auto">
          Create a patient account to book your first appointment, or sign in as staff to manage the hospital.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="btn-primary !px-6 !py-3 text-base">Create an account</Link>
          <Link to="/login" className="btn-secondary !px-6 !py-3 text-base">Log in</Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-600 mb-2">
          <HeartPulse className="w-5 h-5 text-brand-600" /> MediCare+
        </div>
        Hospital Management System &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
