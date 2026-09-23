import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, CalendarClock, Pill,
  Receipt, FileText, Bot, LogOut, Menu, X, UserCog, HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AIAssistantWidget from './AIAssistantWidget';

const NAV_BY_ROLE = {
  admin: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/patients', label: 'Patients', icon: Users },
    { to: '/app/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/app/appointments', label: 'Appointments', icon: CalendarClock },
    { to: '/app/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/app/billing', label: 'Billing', icon: Receipt },
    { to: '/app/records', label: 'Medical Records', icon: FileText },
    { to: '/app/staff', label: 'Staff', icon: UserCog },
  ],
  doctor: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/appointments', label: 'Appointments', icon: CalendarClock },
    { to: '/app/patients', label: 'Patients', icon: Users },
    { to: '/app/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/app/records', label: 'Medical Records', icon: FileText },
  ],
  receptionist: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/patients', label: 'Patients', icon: Users },
    { to: '/app/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/app/appointments', label: 'Appointments', icon: CalendarClock },
    { to: '/app/billing', label: 'Billing', icon: Receipt },
  ],
  patient: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/appointments', label: 'My Appointments', icon: CalendarClock },
    { to: '/app/prescriptions', label: 'My Prescriptions', icon: Pill },
    { to: '/app/billing', label: 'My Bills', icon: Receipt },
    { to: '/app/records', label: 'My Records', icon: FileText },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 inset-y-0 left-0 w-64 bg-brand-950 text-white flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <HeartPulse className="w-7 h-7 text-teal-400" />
          <span className="font-bold text-lg tracking-tight">MediCare+</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setAssistantOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Bot className="w-4 h-4 shrink-0" />
            AI Assistant
          </button>
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 mb-3">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user.name.split(' ')[0]}</span>
          </div>
          <button
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-4 py-2 text-sm font-semibold hover:bg-brand-100 transition-colors"
          >
            <Bot className="w-4 h-4" />
            Ask AI
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AIAssistantWidget open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
