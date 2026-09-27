import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Users,
  Clock,
  UserCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  XCircle,
  Bed,
} from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (hospitalId) {
      loadReceptionData();
    }
  }, [hospitalId]);

  const loadReceptionData = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('sh_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [aptRes, qRes] = await Promise.all([
        fetch(`/api/appointments/hospital/${hospitalId}?date=${new Date().toISOString().split('T')[0]}`, { headers }),
        fetch(`/api/queues/hospital/${hospitalId}`, { headers }),
      ]);

      if (aptRes.ok) setAppointments(await aptRes.json());
      if (qRes.ok) {
        const qList = await qRes.json();
        setQueues(qList);
        if (qList.length > 0) loadQueueEvents(qList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueEvents = async (qid: number) => {
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/queues/${qid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSelectedQueue(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckInPatient = async (aptId: number) => {
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hospitalId,
          status: 'CHECKED_IN',
        }),
      });

      if (res.ok) {
        setStatusMsg('Patient marked as Checked In. Token queued.');
        loadReceptionData();
      }
    } catch {
      setStatusMsg('Failed to check in patient.');
    }
  };

  const handleUpdateTokenStatus = async (eventId: number, status: string) => {
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/queues/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setStatusMsg(`Token event changed to ${status}.`);
        if (selectedQueue) loadQueueEvents(selectedQueue.queue.id);
        loadReceptionData();
      }
    } catch {
      setStatusMsg('Failed to update event status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300">
              Front Desk & Reception Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital #{hospitalId}</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Reception Counter: {user?.fullName}</h1>
          <p className="text-xs text-slate-400">
            Patient Arrival Verification, Token Issuance, and Queue Triage
          </p>
        </div>

        <button
          onClick={loadReceptionData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Grid: Check-in List & Queue Token Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Check-in Table */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Arriving Appointments Today</h3>
            <span className="text-xs text-slate-400">{appointments.length} Scheduled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-cyan-800">{apt.bookingReference}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{apt.patientName}</span>
                      <span className="text-[10px] text-slate-400">{apt.patientPhone}</span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{apt.doctorName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'CHECKED_IN'
                            ? 'bg-cyan-50 text-cyan-700'
                            : apt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {apt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCheckInPatient(apt.id)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px]"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Active Queue & Token Triage */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span>Queue Status & Token Dispatch</span>
            </h3>
            {selectedQueue && (
              <span className="text-xs font-mono font-bold text-teal-700">
                Token #{selectedQueue.queue.currentCallingToken} / {selectedQueue.queue.totalTokens}
              </span>
            )}
          </div>

          {selectedQueue ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span>Department: <strong>{selectedQueue.queue.departmentId}</strong></span>
                <span>Date: <strong>{selectedQueue.queue.date}</strong></span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {selectedQueue.events.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 font-mono font-black text-slate-900 flex items-center justify-center border border-slate-200">
                        #{ev.tokenNumber}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{ev.patientName}</span>
                        <span className="text-[10px] text-slate-500">Status: {ev.status}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      {ev.status === 'WAITING' && (
                        <button
                          onClick={() => handleUpdateTokenStatus(ev.id, 'CALLED')}
                          className="px-2 py-1 rounded bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200 hover:bg-teal-100"
                        >
                          Call
                        </button>
                      )}
                      {ev.status === 'CALLED' && (
                        <button
                          onClick={() => handleUpdateTokenStatus(ev.id, 'IN_ROOM')}
                          className="px-2 py-1 rounded bg-cyan-600 text-white font-bold text-[10px] hover:bg-cyan-700"
                        >
                          Enter Room
                        </button>
                      )}
                      {ev.status !== 'COMPLETED' && ev.status !== 'MISSED' && (
                        <button
                          onClick={() => handleUpdateTokenStatus(ev.id, 'MISSED')}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 hover:bg-rose-100"
                        >
                          Skip/Missed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No active queues found for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
