import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Pill,
  HeartPulse,
  AlertCircle,
  RefreshCw,
  Plus,
  Play,
  UserCheck,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Active Consultation Modal
  const [activeConsultationApt, setActiveConsultationApt] = useState<any | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptions, setPrescriptions] = useState<
    Array<{ medicationName: string; dosage: string; frequency: string; durationDays: number; instructions: string }>
  >([
    { medicationName: '', dosage: '500mg', frequency: 'Twice daily after meals', durationDays: 7, instructions: 'Drink plenty of water' },
  ]);
  const [patientVitals, setPatientVitals] = useState<any[]>([]);

  useEffect(() => {
    if (hospitalId) {
      loadDoctorData();
    }
  }, [hospitalId]);

  const loadDoctorData = async () => {
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
        const qData = await qRes.json();
        setQueues(qData);
        if (qData.length > 0) {
          loadQueueDetails(qData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueDetails = async (qid: number) => {
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/queues/${qid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedQueue(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallNext = async () => {
    if (!selectedQueue) return;
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/queues/${selectedQueue.queue.id}/call-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to call token');

      setStatusMsg(`Calling Patient Token #${data.calledToken} to consultation room!`);
      loadQueueDetails(selectedQueue.queue.id);
    } catch (err: any) {
      setStatusMsg(err.message || 'Call next failed.');
    }
  };

  const handleOpenConsultation = async (apt: any) => {
    setActiveConsultationApt(apt);
    setChiefComplaint(apt.reason || 'General Follow-up');
    setDiagnosis('');
    setClinicalNotes('');

    // Fetch patient vitals
    if (apt.patientId) {
      try {
        const token = localStorage.getItem('sh_token');
        const res = await fetch(`/api/clinical/vitals/${apt.patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setPatientVitals(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddRxRow = () => {
    setPrescriptions([
      ...prescriptions,
      { medicationName: '', dosage: '10mg', frequency: 'Once daily', durationDays: 14, instructions: '' },
    ]);
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultationApt || !diagnosis) return;

    try {
      const token = localStorage.getItem('sh_token');
      const filteredRx = prescriptions.filter((p) => p.medicationName.trim().length > 0);

      const res = await fetch('/api/clinical/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: activeConsultationApt.id,
          patientId: activeConsultationApt.patientId,
          chiefComplaint,
          diagnosis,
          clinicalNotes,
          followUpDate: followUpDate || undefined,
          prescriptionsList: filteredRx,
        }),
      });

      if (res.ok) {
        // Also update appointment status to COMPLETED
        await fetch(`/api/appointments/${activeConsultationApt.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            hospitalId,
            status: 'COMPLETED',
          }),
        });

        setActiveConsultationApt(null);
        setStatusMsg('Consultation completed and prescriptions recorded.');
        loadDoctorData();
      }
    } catch {
      setStatusMsg('Failed to record consultation.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
              Doctor Clinical Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital #{hospitalId}</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Consultation Desk: {user?.fullName}</h1>
          <p className="text-xs text-slate-400">
            Outpatient Queue, Diagnostic Notes, and E-Prescription System
          </p>
        </div>

        <button
          onClick={loadDoctorData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Main Grid: Live Queue Calling on Left, Appointments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Live Queue Caller */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Active Department Queue</span>
            </h3>
            {selectedQueue && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {selectedQueue.queue.status}
              </span>
            )}
          </div>

          {selectedQueue ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 text-center">
                <span className="text-xs uppercase font-bold text-slate-500 block">
                  Current Token in Room
                </span>
                <span className="text-4xl font-black text-teal-700 font-mono my-2 block">
                  #{selectedQueue.queue.currentCallingToken}
                </span>
                <span className="text-xs text-slate-600 block">
                  Total Tokens Issued: {selectedQueue.queue.totalTokens}
                </span>

                <button
                  onClick={handleCallNext}
                  className="mt-4 w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Call Next Patient Token</span>
                </button>
              </div>

              {/* Waiting Tokens list */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Patients in Waiting Line:</span>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedQueue.events
                    .filter((e: any) => e.status === 'WAITING' || e.status === 'CALLED')
                    .map((ev: any) => (
                      <div
                        key={ev.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          ev.status === 'CALLED' ? 'bg-cyan-50 border-cyan-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-white font-mono font-black text-slate-800 flex items-center justify-center border border-slate-200">
                            #{ev.tokenNumber}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{ev.patientName}</span>
                            <span className="text-[10px] text-slate-400">{ev.patientPhone}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.status === 'CALLED' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">No active queue initialized today.</div>
          )}
        </div>

        {/* Right 2 Cols: Doctor's Scheduled Appointments */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Consultation Schedule</h3>
              <p className="text-xs text-slate-500">
                Start consultation, review triage vitals, and issue medication prescriptions.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{appointments.length} Appointments</span>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 transition-colors bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {apt.bookingReference}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{apt.appointmentTime}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : apt.status === 'IN_CONSULTATION'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">{apt.patientName}</h4>
                  <p className="text-xs text-slate-500">Reason: {apt.reason || 'General Visit'}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {apt.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => handleOpenConsultation(apt)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Start Consultation</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      {activeConsultationApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded">
                  {activeConsultationApt.bookingReference}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Consultation with {activeConsultationApt.patientName}
                </h3>
              </div>
              <button
                onClick={() => setActiveConsultationApt(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Patient Vitals Quick Strip */}
            {patientVitals.length > 0 && (
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs">
                <span className="text-[10px] uppercase font-bold text-rose-800 flex items-center gap-1 mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                  Latest Vitals Recorded by Triage Nurse:
                </span>
                <div className="grid grid-cols-4 gap-2 text-slate-800 font-semibold text-[11px]">
                  <span>BP: {patientVitals[0].bloodPressure || 'N/A'}</span>
                  <span>HR: {patientVitals[0].heartRate || 'N/A'} bpm</span>
                  <span>Temp: {patientVitals[0].temperature || 'N/A'}</span>
                  <span>SpO2: {patientVitals[0].oxygenSaturation || 'N/A'}%</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitConsultation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Complaint</label>
                <input
                  type="text"
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes & Observations</label>
                <textarea
                  rows={3}
                  placeholder="Physical examination notes, lab indications..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Prescriptions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Prescribed Medications:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRxRow}
                    className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700"
                  >
                    + Add Drug
                  </button>
                </div>

                <div className="space-y-2">
                  {prescriptions.map((rx, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Drug Name (e.g. Amoxicillin)"
                          value={rx.medicationName}
                          onChange={(e) => {
                            const updated = [...prescriptions];
                            updated[idx].medicationName = e.target.value;
                            setPrescriptions(updated);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (500mg)"
                          value={rx.dosage}
                          onChange={(e) => {
                            const updated = [...prescriptions];
                            updated[idx].dosage = e.target.value;
                            setPrescriptions(updated);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (Twice Daily)"
                          value={rx.frequency}
                          onChange={(e) => {
                            const updated = [...prescriptions];
                            updated[idx].frequency = e.target.value;
                            setPrescriptions(updated);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Days (7)"
                          value={rx.durationDays}
                          onChange={(e) => {
                            const updated = [...prescriptions];
                            updated[idx].durationDays = Number(e.target.value);
                            setPrescriptions(updated);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Instructions (e.g. Take after food with water)"
                        value={rx.instructions}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].instructions = e.target.value;
                          setPrescriptions(updated);
                        }}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveConsultationApt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-xs"
                >
                  Complete & Save Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
