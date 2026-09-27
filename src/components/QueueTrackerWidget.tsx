import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export const QueueTrackerWidget: React.FC<{ initialReference?: string }> = ({
  initialReference = '',
}) => {
  const { t } = useLanguage();
  const [reference, setReference] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/queues/live/${encodeURIComponent(reference.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to locate queue information.');
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Could not find active queue for this reference.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="max-w-xl mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2 border border-teal-100">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Live Digital Queue Monitor</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Track Your Hospital Token in Real-Time
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Enter your appointment booking reference to view live token announcements and estimated wait times.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. APT-2026-METRO-01"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 uppercase tracking-wider font-mono font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="max-w-2xl mx-auto mt-4 p-5 bg-gradient-to-br from-slate-50 to-cyan-50/30 rounded-2xl border border-slate-200">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div>
              <span className="text-[11px] font-mono text-cyan-700 font-bold bg-cyan-100/60 px-2 py-0.5 rounded">
                Ref: {data.appointment.bookingReference}
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {data.appointment.hospitalName}
              </h4>
              <p className="text-xs text-slate-600">
                {data.appointment.departmentName} • {data.appointment.doctorName}
              </p>
            </div>

            <button
              onClick={() => handleSearch()}
              className="flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800 font-medium py-1 px-2.5 rounded-lg border border-cyan-200 bg-white"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Tokens Highlight Row */}
          {data.queue ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
              {/* Patient Token */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                <span className="text-xs text-slate-500 font-medium block">Your Token Number</span>
                <span className="text-3xl font-black text-cyan-700 font-mono my-1 block">
                  #{data.queue.userToken}
                </span>
                <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {data.queue.userStatus}
                </span>
              </div>

              {/* Current Calling Token */}
              <div className="p-4 bg-white rounded-xl border border-cyan-200 shadow-2xs text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500" />
                <span className="text-xs text-slate-500 font-medium block">{t.callingToken}</span>
                <span className="text-3xl font-black text-teal-600 font-mono my-1 block">
                  #{data.queue.currentCallingToken}
                </span>
                <span className="text-[11px] text-teal-700 font-medium">In Consultation Room</span>
              </div>

              {/* Estimated Wait */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                <span className="text-xs text-slate-500 font-medium block">{t.estimatedWait}</span>
                <span className="text-3xl font-black text-slate-800 font-mono my-1 block">
                  ~{data.queue.estimatedWaitMinutes} <span className="text-xs font-normal">mins</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {Math.max(0, data.queue.userToken - data.queue.currentCallingToken)} patients ahead
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              No live queue is active for this appointment at this time.
            </div>
          )}

          {/* Status Tracker */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-700 block mb-2">Visit Progress:</span>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <div className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Booked</span>
              </div>
              <div className="h-0.5 flex-1 bg-emerald-300 mx-2" />
              <div
                className={`flex items-center gap-1 ${
                  ['CALLED', 'IN_ROOM', 'COMPLETED'].includes(data.queue?.userStatus)
                    ? 'text-emerald-700'
                    : 'text-slate-700 font-bold'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Checked In</span>
              </div>
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  ['IN_ROOM', 'COMPLETED'].includes(data.queue?.userStatus)
                    ? 'bg-emerald-300'
                    : 'bg-slate-200'
                }`}
              />
              <div
                className={`flex items-center gap-1 ${
                  data.queue?.userStatus === 'IN_ROOM'
                    ? 'text-cyan-600 font-bold animate-pulse'
                    : data.queue?.userStatus === 'COMPLETED'
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>In Room</span>
              </div>
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  data.queue?.userStatus === 'COMPLETED' ? 'bg-emerald-300' : 'bg-slate-200'
                }`}
              />
              <div
                className={`flex items-center gap-1 ${
                  data.queue?.userStatus === 'COMPLETED' ? 'text-emerald-700 font-bold' : 'text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
