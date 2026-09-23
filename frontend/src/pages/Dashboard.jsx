import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, CalendarClock, Receipt, Pill, FileText, Clock, AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard, Badge, EmptyState } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data)).catch(() => setStats({}));
    api.get('/appointments').then(({ data }) => setAppointments(data.appointments.slice(0, 5))).catch(() => {});
  }, []);

  if (!stats) return <div className="text-slate-400 text-sm">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {user.role === 'patient' ? 'My Dashboard' : `${user.role[0].toUpperCase()}${user.role.slice(1)} Dashboard`}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening today.</p>
      </div>

      {user.role === 'admin' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Patients" value={stats.totalPatients} icon={Users} tone="brand" />
          <StatCard label="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} tone="teal" />
          <StatCard label="Today's Appointments" value={stats.todayAppts} icon={CalendarClock} tone="amber" />
          <StatCard label="Pending Appointments" value={stats.pendingAppts} icon={Clock} tone="rose" />
          <StatCard label="Revenue Collected" value={`₹${stats.revenue?.toLocaleString?.() ?? stats.revenue}`} icon={Receipt} tone="teal" />
          <StatCard label="Outstanding Bills" value={`₹${stats.outstanding?.toLocaleString?.() ?? stats.outstanding}`} icon={AlertCircle} tone="rose" />
        </div>
      )}

      {user.role === 'doctor' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Appointments" value={stats.todayAppts} icon={CalendarClock} tone="brand" />
          <StatCard label="My Patients" value={stats.totalPatients} icon={Users} tone="teal" />
          <StatCard label="Pending Requests" value={stats.pendingAppts} icon={Clock} tone="amber" />
          <StatCard label="Prescriptions Written" value={stats.prescriptionsWritten} icon={Pill} tone="teal" />
        </div>
      )}

      {user.role === 'receptionist' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Appointments" value={stats.todayAppts} icon={CalendarClock} tone="brand" />
          <StatCard label="Pending Appointments" value={stats.pendingAppts} icon={Clock} tone="amber" />
          <StatCard label="Unpaid Bills" value={stats.unpaidBills} icon={Receipt} tone="rose" />
          <StatCard label="Total Patients" value={stats.totalPatients} icon={Users} tone="teal" />
        </div>
      )}

      {user.role === 'patient' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Upcoming Appointments" value={stats.upcomingAppts} icon={CalendarClock} tone="brand" />
          <StatCard label="Active Prescriptions" value={stats.activePrescriptions} icon={Pill} tone="teal" />
          <StatCard label="Unpaid Bills" value={stats.unpaidBills} icon={Receipt} tone="rose" />
          <StatCard label="Medical Records" value={stats.totalRecords} icon={FileText} tone="amber" />
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Recent Appointments</h2>
          <Link to="/app/appointments" className="text-sm text-brand-600 font-medium hover:underline">View all</Link>
        </div>
        {appointments.length === 0 ? (
          <EmptyState message="No appointments yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-medium">Patient</th>
                  <th className="py-2 font-medium">Doctor</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Time</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-700">{a.patient_name}</td>
                    <td className="py-2.5 text-slate-700">{a.doctor_name}</td>
                    <td className="py-2.5 text-slate-500">{a.appointment_date}</td>
                    <td className="py-2.5 text-slate-500">{a.appointment_time}</td>
                    <td className="py-2.5"><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
