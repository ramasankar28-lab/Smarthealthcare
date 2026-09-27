import React from 'react';
import {
  Calendar,
  Clock,
  Building2,
  User,
  CreditCard,
  Radio,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  Search,
  ShieldCheck,
  Megaphone,
  Activity,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { PatientNavTab } from './PatientSidebar.tsx';

interface DashboardOverviewTabProps {
  data: any;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigate: (tab: PatientNavTab, extra?: any) => void;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onNavigate,
}) => {
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="text-sm font-semibold text-red-900">Failed to load dashboard</h3>
        <p className="text-xs text-red-700">{error}</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const greeting = data?.greeting;
  const nextApt = data?.nextAppointment;
  const outstanding = data?.outstandingBills;
  const activities = data?.recentActivity || [];
  const updates = data?.hospitalUpdates || [];

  return (
    <div className="space-y-6">
      {/* 1. Patient Greeting Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
              <span>Smart Health Network</span>
              <span aria-hidden="true">·</span>
              <span>Personal Patient Record</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {greeting?.fullName || 'Patient'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span>Blood Group: <strong className="text-white">{greeting?.bloodGroup}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Allergies: <strong className="text-white">{greeting?.allergies}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Emergency Contact: <strong className="text-white">{greeting?.emergencyContact}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white transition-colors"
              title="Refresh live dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigate('book-appointment')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Book Appointment</span>
            <span className="text-[11px] text-slate-400">Doctor slots</span>
          </button>

          <button
            onClick={() => onNavigate('find-hospital')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Find Hospital</span>
            <span className="text-[11px] text-slate-400">Emergency & beds</span>
          </button>

          <button
            onClick={() => onNavigate('live-tracking')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Track Appointment</span>
            <span className="text-[11px] text-slate-400">Live queue token</span>
          </button>

          <button
            onClick={() => onNavigate('bills-payments')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Pay Bill</span>
            <span className="text-[11px] text-slate-400">Card, UPI, Insurance</span>
          </button>

          <button
            onClick={() => onNavigate('insurance-hospitals')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-xs transition-all text-center group col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Insurance Hospitals</span>
            <span className="text-[11px] text-slate-400">Cashless network</span>
          </button>
        </div>
      </div>

      {/* 3. Main Grid: Next Appointment & Outstanding Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900">Next Appointment</h3>
              </div>
              {nextApt && (
                <span className="text-xs font-semibold text-slate-500">
                  Ref: {nextApt.bookingReference}
                </span>
              )}
            </div>

            {nextApt ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />
                      {nextApt.hospitalName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {nextApt.hospitalAddress || nextApt.hospitalCity}
                    </p>
                    <p className="text-xs font-medium text-slate-700 pt-1">
                      Department: <span className="font-semibold text-cyan-800">{nextApt.departmentName}</span>
                    </p>
                  </div>

                  {/* Doctor badge */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shrink-0 sm:text-right">
                    <div className="flex items-center sm:justify-end gap-2 text-xs font-bold text-slate-900">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      Dr. {nextApt.doctorName || 'Assigned Physician'}
                    </div>
                    <div className="text-[11px] text-slate-500">{nextApt.doctorSpecialty || 'Specialist'}</div>
                    {nextApt.roomNumber && (
                      <div className="text-[11px] font-semibold text-cyan-700 mt-1">Room: {nextApt.roomNumber}</div>
                    )}
                  </div>
                </div>

                {/* Queue & Time Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-cyan-50/60 border border-cyan-100 rounded-lg p-2.5">
                    <span className="text-[10px] text-cyan-700 font-semibold block uppercase">Appointment Time</span>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      {nextApt.appointmentTime}
                    </span>
                    <span className="text-[10px] text-slate-500">{nextApt.appointmentDate}</span>
                  </div>

                  <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2.5">
                    <span className="text-[10px] text-purple-700 font-semibold block uppercase">Your Token</span>
                    <span className="text-sm font-extrabold text-purple-900 block mt-0.5">
                      #{nextApt.queueInfo?.tokenNumber || '1'}
                    </span>
                    <span className="text-[10px] text-slate-500">Assigned token</span>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2.5">
                    <span className="text-[10px] text-blue-700 font-semibold block uppercase">Queue Status</span>
                    <span className="text-xs font-bold text-blue-900 block mt-0.5">
                      {nextApt.queueInfo?.status || nextApt.status}
                    </span>
                    <span className="text-[10px] text-slate-500">Live department</span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2.5">
                    <span className="text-[10px] text-amber-700 font-semibold block uppercase">Current Serving</span>
                    <span className="text-sm font-extrabold text-amber-900 block mt-0.5">
                      #{nextApt.queueInfo?.currentCallingToken || 0}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ~{nextApt.queueInfo?.estimatedWaitMinutes ?? 15} mins wait
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-10 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800">No upcoming appointments</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have no scheduled consultations. Find a hospital or specialist to book an appointment slot.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('book-appointment')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" /> Book Consultation
                  </button>
                </div>
              </div>
            )}
          </div>

          {nextApt && (
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Check in at receptionist kiosk or track online</span>
              <button
                onClick={() => onNavigate('live-tracking', { reference: nextApt.bookingReference })}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800"
              >
                Track Live Queue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Outstanding Bills Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Bills</h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {outstanding?.count || 0} Pending
              </span>
            </div>

            <div className="py-4 space-y-2">
              <span className="text-xs text-slate-500">Total Balance Due</span>
              <div className="text-3xl font-extrabold text-slate-900">
                ${outstanding?.totalAmount ? outstanding.totalAmount.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-slate-500">
                Covers consultations, laboratory tests, and inpatient diagnostics across affiliated hospitals.
              </p>
            </div>

            {outstanding?.bills && outstanding.bills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {outstanding.bills.slice(0, 2).map((b: any) => (
                  <div key={b.id} className="text-xs flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-800 block">#{b.billNumber}</span>
                      <span className="text-[11px] text-slate-500">{b.hospitalName}</span>
                    </div>
                    <span className="font-bold text-slate-900">${b.netPayable}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('bills-payments')}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {outstanding?.count ? `Pay Outstanding (${outstanding.count})` : 'View Billing History'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Activity & Hospital Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-600" /> Recent Activity
            </h3>
            <span className="text-xs text-slate-400">PostgreSQL Log</span>
          </div>

          {activities.length > 0 ? (
            <div className="divide-y divide-slate-100 mt-2">
              {activities.map((act: any) => (
                <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 block">{act.title}</span>
                    <span className="text-[11px] text-slate-500">{act.description}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent activity recorded yet.
            </div>
          )}
        </div>

        {/* Hospital Updates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-amber-600" /> Hospital Network Updates
            </h3>
            <span className="text-xs text-slate-400">Official Notices</span>
          </div>

          {updates.length > 0 ? (
            <div className="divide-y divide-slate-100 mt-2">
              {updates.map((u: any) => (
                <div key={u.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{u.title}</span>
                    <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                      {u.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{u.content}</p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{u.hospitalName || 'Network Facility'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No hospital announcements at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
