import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Radio,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { PatientNavTab } from './PatientSidebar.tsx';

interface BookAppointmentTabProps {
  initialHospitalId?: number | null;
  onNavigate: (tab: PatientNavTab, extra?: any) => void;
  onBookingComplete?: () => void;
}

export const BookAppointmentTab: React.FC<BookAppointmentTabProps> = ({
  initialHospitalId,
  onNavigate,
  onBookingComplete,
}) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospId, setSelectedHospId] = useState<number | null>(initialHospitalId || null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('09:30');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Load Hospitals
  useEffect(() => {
    fetch('/api/hospitals?status=ACTIVE')
      .then((r) => r.json())
      .then((data) => {
        setHospitals(data);
        if (!selectedHospId && data.length > 0) {
          setSelectedHospId(data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // When Hospital changes, load Departments and Doctors
  useEffect(() => {
    if (selectedHospId) {
      setLoading(true);
      Promise.all([
        fetch(`/api/hospitals/${selectedHospId}/departments`).then((r) => r.json()),
        fetch(`/api/hospitals/${selectedHospId}/doctors`).then((r) => r.json()),
      ])
        .then(([depts, docs]) => {
          setDepartments(depts);
          setSelectedDeptId(depts[0]?.id || null);

          setDoctors(docs);
          setSelectedDocId(docs[0]?.id || null);
        })
        .catch((err) => setError('Failed to load hospital departments or doctors.'))
        .finally(() => setLoading(false));
    }
  }, [selectedHospId]);

  // When Doctor or Date changes, load Slots
  useEffect(() => {
    if (selectedDocId && appointmentDate) {
      fetch(`/api/doctors/${selectedDocId}/slots?date=${appointmentDate}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(data);
          const avail = data.find((s: any) => s.status === 'AVAILABLE');
          if (avail) {
            setSelectedSlotId(avail.id);
            setAppointmentTime(avail.startTime);
          } else {
            setSelectedSlotId(null);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedDocId, appointmentDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospId || !selectedDeptId || !selectedDocId) {
      setError('Please select a hospital, department, and physician.');
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hospitalId: selectedHospId,
          departmentId: selectedDeptId,
          doctorId: selectedDocId,
          slotId: selectedSlotId || undefined,
          appointmentDate,
          appointmentTime,
          reason: reason || 'Outpatient Clinical Consultation',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment.');

      setSuccessData(data);
      if (onBookingComplete) onBookingComplete();
    } catch (err: any) {
      setError(err.message || 'Error booking appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedHospital = hospitals.find((h) => h.id === selectedHospId);
  const selectedDoctor = doctors.find((d) => d.id === selectedDocId);

  // Success view
  if (successData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Booking Confirmed</span>
          <h2 className="text-xl font-bold text-slate-900">Consultation Scheduled Successfully</h2>
          <p className="text-xs text-slate-500">
            Your appointment has been registered in the hospital management system and a live queue token has been assigned.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Booking Reference</span>
            <span className="font-bold text-slate-900 font-mono">{successData.bookingReference}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Assigned Queue Token</span>
            <span className="font-extrabold text-cyan-800 text-sm">#{successData.queueToken}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Hospital</span>
            <span className="font-semibold text-slate-800">{selectedHospital?.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Physician</span>
            <span className="font-semibold text-slate-800">Dr. {selectedDoctor?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Schedule</span>
            <span className="font-semibold text-slate-800">{appointmentDate} at {appointmentTime}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onNavigate('live-tracking', { reference: successData.bookingReference })}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Radio className="w-3.5 h-3.5" /> Track in Live Queue
          </button>
          <button
            onClick={() => onNavigate('my-appointments')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
          >
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Book Outpatient Appointment</h2>
          <p className="text-xs text-slate-500">
            Select an affiliated hospital, medical specialty, doctor, and slot to generate a queue token.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form fields (2 cols) */}
        <div className="lg:col-span-2 space-y-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          {/* Step 1: Hospital */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-900">
              1. Select Hospital Facility *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={selectedHospId || ''}
                onChange={(e) => setSelectedHospId(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white font-medium"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.city} ({h.availableBeds} beds available)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Department & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-900">
                2. Medical Department *
              </label>
              <select
                value={selectedDeptId || ''}
                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-900">
                3. Consulting Doctor *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => setSelectedDocId(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.fullName} ({doc.specialty} • ${doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Date & Slots */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-900">
              4. Consultation Schedule *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-600 mb-1 block">Appointment Date</span>
                <input
                  type="date"
                  value={appointmentDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                />
              </div>

              <div>
                <span className="text-xs text-slate-600 mb-1 block">Preferred Time</span>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                />
              </div>
            </div>

            {/* Doctor Slots Pills if loaded from DB */}
            {slots.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                  Available Doctor Slots for this Date:
                </span>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      disabled={s.status !== 'AVAILABLE'}
                      onClick={() => {
                        setSelectedSlotId(s.id);
                        setAppointmentTime(s.startTime);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        selectedSlotId === s.id
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : s.status === 'AVAILABLE'
                            ? 'bg-white text-slate-700 border-slate-200 hover:border-cyan-500'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {s.startTime} - {s.endTime} ({s.status})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Chief Complaint / Reason for Visit (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Describe symptoms, follow-up purpose, or prescription refill requirements"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
            />
          </div>
        </div>

        {/* Sidebar Summary & Submit (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              Appointment Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Facility</span>
                <span className="font-semibold text-slate-900 block">{selectedHospital?.name || 'Selected Hospital'}</span>
                <span className="text-[11px] text-slate-500">{selectedHospital?.city}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Doctor & Fee</span>
                <span className="font-semibold text-slate-900 block">Dr. {selectedDoctor?.fullName || 'Physician'}</span>
                <span className="text-[11px] text-cyan-800 font-bold">
                  Consultation Fee: ${selectedDoctor?.consultationFee || 50}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Selected Schedule</span>
                <span className="font-semibold text-slate-900 block">{appointmentDate} at {appointmentTime}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                A digital consultation token is generated upon confirmation. An initial invoice will be added to your Billing balance.
              </div>
            </div>

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              {bookingLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Token...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Generate Token
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
