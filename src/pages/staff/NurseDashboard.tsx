import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  HeartPulse,
  Activity,
  UserCheck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Thermometer,
} from 'lucide-react';

export const NurseDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Vitals recording modal
  const [selectedPatientApt, setSelectedPatientApt] = useState<any | null>(null);
  const [bloodPressure, setBloodPressure] = useState('120/80 mmHg');
  const [heartRate, setHeartRate] = useState(72);
  const [temperature, setTemperature] = useState('98.6 F');
  const [respiratoryRate, setRespiratoryRate] = useState(16);
  const [oxygenSaturation, setOxygenSaturation] = useState(99);
  const [weightKg, setWeightKg] = useState('70 kg');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hospitalId) {
      loadNurseAppointments();
    }
  }, [hospitalId]);

  const loadNurseAppointments = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(
        `/api/appointments/hospital/${hospitalId}?date=${new Date().toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setAppointments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVitalsModal = (apt: any) => {
    setSelectedPatientApt(apt);
  };

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientApt) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/clinical/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatientApt.patientId,
          bloodPressure,
          heartRate: Number(heartRate),
          temperature,
          respiratoryRate: Number(respiratoryRate),
          oxygenSaturation: Number(oxygenSaturation),
          weightKg,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Vitals successfully logged for patient ${selectedPatientApt.patientName}.`);
        setSelectedPatientApt(null);
      }
    } catch {
      setStatusMsg('Failed to record vitals.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300">
              Nursing & Triage Station
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital #{hospitalId}</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Nurse Care Desk: {user?.fullName}</h1>
          <p className="text-xs text-slate-400">
            Vital Signs Monitoring, Patient Triage, and Outpatient Preparation
          </p>
        </div>

        <button
          onClick={loadNurseAppointments}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Patient List</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Patient Triage Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Patients for Triage & Vitals</h3>
            <p className="text-xs text-slate-500">Record baseline indicators before physician consultation.</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{appointments.length} Patients Scheduled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Ref / Time</th>
                <th className="p-3.5">Patient Name</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Attending Doctor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-cyan-800 block">{apt.bookingReference}</span>
                    <span className="text-[11px] text-slate-400">{apt.appointmentTime}</span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{apt.patientName}</td>
                  <td className="p-3.5 text-slate-600">{apt.departmentName}</td>
                  <td className="p-3.5 text-slate-800 font-medium">{apt.doctorName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {apt.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleOpenVitalsModal(apt)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 ml-auto"
                    >
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>Record Vitals</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Vitals Modal */}
      {selectedPatientApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Record Patient Vitals: {selectedPatientApt.patientName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Booking Ref: {selectedPatientApt.bookingReference} • {selectedPatientApt.departmentName}
            </p>

            <form onSubmit={handleSubmitVitals} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    required
                    placeholder="120/80 mmHg"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    required
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Temperature</label>
                  <input
                    type="text"
                    required
                    placeholder="98.6 F"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    required
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Respiratory Rate</label>
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weight</label>
                  <input
                    type="text"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPatientApt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Patient Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
