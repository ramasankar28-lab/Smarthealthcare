import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  User,
  Radio,
  XCircle,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { PatientNavTab } from './PatientSidebar.tsx';

interface MyAppointmentsTabProps {
  appointments: any[];
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: PatientNavTab, extra?: any) => void;
}

export const MyAppointmentsTab: React.FC<MyAppointmentsTabProps> = ({
  appointments,
  loading,
  onRefresh,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleCancelAppointment = async (appointmentId: number) => {
    setActionLoading(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/appointments/${appointmentId}/patient-cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by patient' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment.');

      setStatusMsg({ text: 'Appointment cancelled successfully.' });
      setCancellingId(null);
      setCancelReason('');
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error cancelling appointment.', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const statusMatch =
      filter === 'ALL'
        ? true
        : filter === 'UPCOMING'
          ? ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'PENDING'].includes(apt.status)
          : filter === 'COMPLETED'
            ? apt.status === 'COMPLETED'
            : apt.status === 'CANCELLED';

    const searchMatch =
      !search ||
      apt.hospitalName?.toLowerCase().includes(search.toLowerCase()) ||
      apt.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
      apt.bookingReference?.toLowerCase().includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Appointments & Consultations</h2>
          <p className="text-xs text-slate-500">
            View upcoming schedule, track queue tokens, or cancel appointments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-xs"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('book-appointment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <CalendarPlus className="w-3.5 h-3.5" /> Book Consultation
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMsg.isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {statusMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          {(['UPCOMING', 'ALL', 'COMPLETED', 'CANCELLED'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setFilter(tabKey)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tabKey
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tabKey === 'UPCOMING'
                ? 'Upcoming'
                : tabKey === 'ALL'
                  ? 'All'
                  : tabKey === 'COMPLETED'
                    ? 'Completed'
                    : 'Cancelled'}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAppointments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'UPCOMING'
              ? 'You have no upcoming consultations scheduled. Book an appointment slot with a specialist.'
              : 'No appointments match the selected filter.'}
          </p>
          <button
            onClick={() => onNavigate('book-appointment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold"
          >
            <CalendarPlus className="w-3.5 h-3.5" /> Book Appointment
          </button>
        </div>
      )}

      {/* Appointment Cards */}
      {!loading && filteredAppointments.length > 0 && (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isUpcoming = ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'PENDING'].includes(
              apt.status
            );

            return (
              <div
                key={apt.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {apt.bookingReference}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-cyan-100 text-cyan-800'
                              : apt.status === 'CHECKED_IN'
                                ? 'bg-purple-100 text-purple-800'
                                : apt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-cyan-700 shrink-0" />
                        {apt.hospitalName}
                      </h3>
                      <p className="text-xs text-slate-500">{apt.departmentName}</p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-xs font-bold text-slate-800 flex items-center sm:justify-end gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Dr. {apt.doctorName || 'Assigned Doctor'}
                      </div>
                      <div className="text-[11px] text-slate-500">{apt.doctorSpecialty}</div>
                      {apt.roomNumber && (
                        <div className="text-[11px] font-semibold text-cyan-700 mt-0.5">
                          Room: {apt.roomNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule & Queue Status row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Date & Time</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.appointmentDate} · {apt.appointmentTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Queue Token</span>
                      <span className="font-extrabold text-cyan-800 text-sm block mt-0.5">
                        #{apt.queueInfo?.tokenNumber || '1'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Current Serving</span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                        #{apt.queueInfo?.currentCallingToken ?? 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Reason</span>
                      <span className="text-slate-600 block truncate mt-0.5">
                        {apt.reason || 'General Consultation'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isUpcoming && (
                      <button
                        onClick={() =>
                          onNavigate('live-tracking', { reference: apt.bookingReference })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Radio className="w-3.5 h-3.5 text-cyan-700" /> Track Live Queue
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isUpcoming && cancellingId !== apt.id && (
                      <button
                        onClick={() => setCancellingId(apt.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Cancel Prompt Drawer if clicked */}
                {cancellingId === apt.id && (
                  <div className="mt-3 p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-red-900">
                      Are you sure you want to cancel this appointment?
                    </p>
                    <input
                      type="text"
                      placeholder="Reason for cancellation (optional)"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-red-200 rounded-lg focus:outline-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setCancellingId(null)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold"
                      >
                        Keep Appointment
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                      >
                        {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
