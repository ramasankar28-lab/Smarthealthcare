import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Calendar,
  Clock,
  Building2,
  FileText,
  CreditCard,
  ShieldCheck,
  HeartPulse,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Star,
  Receipt,
  Download,
  Bell,
  Stethoscope,
  Pill,
} from 'lucide-react';

export const PatientDashboard: React.FC<{ initialAction?: string; initialHospitalId?: number }> = ({
  initialAction,
  initialHospitalId,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'appointments' | 'book' | 'insurance' | 'records' | 'billing' | 'reviews'>('appointments');

  // Appointments & Queues
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loadingApts, setLoadingApts] = useState(false);

  // Booking Flow State
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospId, setSelectedHospId] = useState<number | null>(initialHospitalId || null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('09:30');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Insurance State
  const [patientInsurances, setPatientInsurances] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [newPolicyProviderId, setNewPolicyProviderId] = useState<number | null>(null);
  const [newPolicyNumber, setNewPolicyNumber] = useState('');
  const [newPolicyValidUntil, setNewPolicyValidUntil] = useState('2028-12-31');
  const [newPolicyCoverage, setNewPolicyCoverage] = useState(50000);

  // Records & Vitals
  const [vitalsList, setVitalsList] = useState<any[]>([]);
  const [consultationsList, setConsultationsList] = useState<any[]>([]);
  const [medicalRecordsList, setMedicalRecordsList] = useState<any[]>([]);

  // Billing
  const [billsList, setBillsList] = useState<any[]>([]);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Review
  const [reviewHospId, setReviewHospId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  // Status message
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAction === 'book') {
      setActiveTab('book');
      if (initialHospitalId) setSelectedHospId(initialHospitalId);
    }
    loadAllPatientData();
  }, [initialAction, initialHospitalId]);

  // Load appointments
  const loadAppointments = async () => {
    setLoadingApts(true);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/appointments/patient/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAppointmentsList(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApts(false);
    }
  };

  const loadAllPatientData = async () => {
    const token = localStorage.getItem('sh_token');
    const headers = { Authorization: `Bearer ${token}` };

    loadAppointments();

    try {
      const [hRes, pRes, insRes, billRes, notifRes] = await Promise.all([
        fetch('/api/hospitals'),
        fetch('/api/insurance/providers'),
        fetch('/api/insurance/patient/me', { headers }),
        fetch('/api/billing/patient/me', { headers }),
        fetch('/api/notifications/me', { headers }),
      ]);

      if (hRes.ok) setHospitals(await hRes.json());
      if (pRes.ok) setProviders(await pRes.json());
      if (insRes.ok) setPatientInsurances(await insRes.json());
      if (billRes.ok) setBillsList(await billRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());

      // If user has a patientProfileId, load clinical records
      if (user?.patientProfileId) {
        const [vRes, cRes, mRes] = await Promise.all([
          fetch(`/api/clinical/vitals/${user.patientProfileId}`, { headers }),
          fetch(`/api/clinical/consultations/${user.patientProfileId}`, { headers }),
          fetch(`/api/clinical/records/${user.patientProfileId}`, { headers }),
        ]);
        if (vRes.ok) setVitalsList(await vRes.json());
        if (cRes.ok) setConsultationsList(await cRes.json());
        if (mRes.ok) setMedicalRecordsList(await mRes.json());
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    }
  };

  // Booking step triggers
  useEffect(() => {
    if (selectedHospId) {
      fetch(`/api/hospitals/${selectedHospId}/departments`)
        .then((r) => r.json())
        .then((data) => {
          setDepartments(data);
          setSelectedDeptId(data[0]?.id || null);
        });

      fetch(`/api/hospitals/${selectedHospId}/doctors`)
        .then((r) => r.json())
        .then((data) => {
          setDoctors(data);
          setSelectedDocId(data[0]?.id || null);
        });
    }
  }, [selectedHospId]);

  useEffect(() => {
    if (selectedDocId) {
      fetch(`/api/doctors/${selectedDocId}/slots?date=${appointmentDate}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(data);
          const avail = data.find((s: any) => s.status === 'AVAILABLE');
          setSelectedSlotId(avail ? avail.id : null);
          if (avail) {
            setAppointmentTime(avail.startTime);
          }
        });
    }
  }, [selectedDocId, appointmentDate]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospId || !selectedDocId || !selectedDeptId) {
      setStatusMsg('Please complete all selection steps.');
      return;
    }

    setBookingLoading(true);
    setStatusMsg(null);
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
          reason: appointmentReason || 'General Medical Consultation',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment.');
      }

      setBookingSuccess(data);
      loadAllPatientData();
    } catch (err: any) {
      setStatusMsg(err.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyProviderId || !newPolicyNumber) {
      setStatusMsg('Please select provider and specify policy number.');
      return;
    }

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/insurance/patient/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId: newPolicyProviderId,
          policyNumber: newPolicyNumber,
          validUntil: newPolicyValidUntil,
          coverageAmount: newPolicyCoverage,
        }),
      });

      if (res.ok) {
        setShowAddPolicy(false);
        setStatusMsg('Insurance policy linked successfully.');
        loadAllPatientData();
      }
    } catch {
      setStatusMsg('Failed to add policy.');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedBillForPayment) return;
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billId: selectedBillForPayment.id,
          hospitalId: selectedBillForPayment.hospitalId,
          amount: selectedBillForPayment.netPayable - selectedBillForPayment.paidAmount,
          paymentMethod,
        }),
      });

      if (res.ok) {
        setSelectedBillForPayment(null);
        setStatusMsg('Payment successful! Receipt generated.');
        loadAllPatientData();
      }
    } catch {
      setStatusMsg('Payment failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewHospId) return;

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/clinical/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hospitalId: reviewHospId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        setStatusMsg('Thank you for your feedback! Review submitted.');
        setReviewComment('');
      }
    } catch {
      setStatusMsg('Failed to submit review.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-white/20">
              Universal Patient Account
            </span>
            <span className="text-xs text-cyan-100">Valid across all network hospitals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Welcome, {user?.fullName}</h1>
          <p className="text-xs text-cyan-100 mt-1">
            Registered Email: {user?.email} • ID: #{user?.id}
          </p>
        </div>

        <button
          onClick={() => {
            setBookingSuccess(null);
            setActiveTab('book');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-cyan-800 hover:bg-cyan-50 font-bold text-xs shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-cyan-600" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'appointments', label: 'My Appointments & Live Queue', icon: Calendar },
          { id: 'book', label: 'Book Appointment', icon: Plus },
          { id: 'insurance', label: 'My Insurances & Coverage', icon: ShieldCheck },
          { id: 'records', label: 'Medical History & Vitals', icon: HeartPulse },
          { id: 'billing', label: 'Invoices & Payments', icon: CreditCard },
          { id: 'reviews', label: 'Submit Hospital Review', icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Appointments & Live Queue */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Active Appointments & Queue Tokens ({appointmentsList.length})
            </h3>
            <button
              onClick={loadAppointments}
              className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingApts ? 'animate-spin' : ''}`} />
              <span>Refresh Tokens</span>
            </button>
          </div>

          {appointmentsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentsList.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">
                          {apt.bookingReference}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1">{apt.hospitalName}</h4>
                        <p className="text-xs text-slate-500">
                          {apt.departmentName} • {apt.doctorName} ({apt.doctorSpecialty})
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          apt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : apt.status === 'CHECKED_IN'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {apt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Scheduled Date</span>
                        <span className="font-semibold text-slate-800">{apt.appointmentDate} at {apt.appointmentTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Room Location</span>
                        <span className="font-semibold text-slate-800">{apt.roomNumber || 'Room 101'}</span>
                      </div>
                    </div>

                    {/* Live Queue Banner */}
                    {apt.queueInfo && (
                      <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-teal-800 block">
                            Your Queue Token
                          </span>
                          <span className="text-2xl font-black text-teal-700 font-mono">
                            #{apt.queueInfo.tokenNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Now Calling
                          </span>
                          <span className="text-xl font-bold text-slate-800 font-mono">
                            #{apt.queueInfo.currentCallingToken}
                          </span>
                          <span className="text-[10px] text-teal-700 font-semibold block">
                            ~{apt.queueInfo.estimatedWaitMinutes} mins wait
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Reason: {apt.reason}</span>
                    <span className="font-mono text-slate-400">{apt.hospitalCity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600">You have no scheduled appointments yet.</p>
              <button
                onClick={() => setActiveTab('book')}
                className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold"
              >
                Book Your First Appointment
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Book Appointment */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-3xl">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule an Appointment</h3>
          <p className="text-xs text-slate-500 mb-6">
            Choose your desired hospital, department, doctor, and convenient slot.
          </p>

          {bookingSuccess ? (
            <div className="p-6 bg-teal-50 rounded-2xl border border-teal-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-teal-900">Appointment Confirmed!</h4>
              <p className="text-xs text-teal-800">
                Your booking reference is{' '}
                <strong className="font-mono text-sm bg-teal-100 px-2 py-0.5 rounded">
                  {bookingSuccess.bookingReference}
                </strong>
              </p>
              <div className="p-4 bg-white rounded-xl border border-teal-200 max-w-sm mx-auto text-xs">
                <span className="text-slate-500 block">Assigned Queue Token:</span>
                <span className="text-3xl font-black text-teal-700 font-mono my-1 block">
                  #{bookingSuccess.queueToken}
                </span>
                <span className="text-slate-500">
                  Initial consultation bill #{bookingSuccess.billId} generated in billing tab.
                </span>
              </div>
              <button
                onClick={() => {
                  setBookingSuccess(null);
                  setActiveTab('appointments');
                }}
                className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700"
              >
                View in Appointments
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Step 1: Select Hospital */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Select Hospital Network Location *
                </label>
                <select
                  required
                  value={selectedHospId || ''}
                  onChange={(e) => setSelectedHospId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Choose Hospital --</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city}) - Beds Available: {h.availableBeds}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Department & Doctor */}
              {selectedHospId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Specialty Department *
                    </label>
                    <select
                      required
                      value={selectedDeptId || ''}
                      onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Doctor / Physician *
                    </label>
                    <select
                      required
                      value={selectedDocId || ''}
                      onChange={(e) => setSelectedDocId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- Choose Doctor --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.fullName} ({doc.specialty}) - ${doc.consultationFee}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Select Date & Available Slot */}
              {selectedDocId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Appointment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      5. Available Slot
                    </label>
                    {slots.length > 0 ? (
                      <select
                        value={selectedSlotId || ''}
                        onChange={(e) => {
                          const sid = Number(e.target.value);
                          setSelectedSlotId(sid);
                          const s = slots.find((sl) => sl.id === sid);
                          if (s) setAppointmentTime(s.startTime);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {slots.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={s.status === 'FULL' || s.status === 'CANCELLED'}
                          >
                            {s.startTime} - {s.endTime} ({s.status})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Follow-up consultation, chest discomfort, routine checkup..."
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{bookingLoading ? 'Securing Slot...' : 'Confirm Appointment & Generate Queue Token'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: My Insurances */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              My Health Insurance Policies ({patientInsurances.length})
            </h3>
            <button
              onClick={() => setShowAddPolicy(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Link Insurance Policy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientInsurances.map((ins) => (
              <div
                key={ins.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {ins.providerCode} Cashless Verified
                  </span>
                  <span className="text-[10px] text-slate-400">Valid: {ins.validUntil}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{ins.providerName}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Policy ID</span>
                    <span className="font-mono font-bold text-slate-800">{ins.policyNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Coverage Sum</span>
                    <span className="font-bold text-emerald-600">${ins.coverageAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Policy Modal */}
          {showAddPolicy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Link Insurance Policy</h3>
                <form onSubmit={handleAddPolicy} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Insurance Provider
                    </label>
                    <select
                      required
                      value={newPolicyProviderId || ''}
                      onChange={(e) => setNewPolicyProviderId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- Choose Provider --</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Policy / Member ID Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BCBS-994102"
                      value={newPolicyNumber}
                      onChange={(e) => setNewPolicyNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newPolicyValidUntil}
                        onChange={(e) => setNewPolicyValidUntil(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Coverage Limit ($)
                      </label>
                      <input
                        type="number"
                        required
                        value={newPolicyCoverage}
                        onChange={(e) => setNewPolicyCoverage(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPolicy(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                    >
                      Link Policy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Medical History & Vitals */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Vitals History */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <span>Recorded Vitals (Triage History)</span>
            </h3>

            {vitalsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vitalsList.map((v) => (
                  <div key={v.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(v.recordedAt).toLocaleString()}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                        <span className="font-bold text-slate-800">{v.bloodPressure || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Heart Rate</span>
                        <span className="font-bold text-rose-600">{v.heartRate ? `${v.heartRate} bpm` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Oxygen (SpO2)</span>
                        <span className="font-bold text-teal-600">{v.oxygenSaturation ? `${v.oxygenSaturation}%` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Body Temp</span>
                        <span className="font-bold text-slate-800">{v.temperature || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
                No vitals recorded yet. When you visit a triage nurse, recordings will appear here.
              </div>
            )}
          </div>

          {/* Consultations & Prescriptions */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-600" />
              <span>Physician Consultations & Prescriptions</span>
            </h3>

            {consultationsList.length > 0 ? (
              <div className="space-y-4">
                {consultationsList.map((c) => (
                  <div key={c.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{c.doctorName} ({c.doctorSpecialty})</h4>
                        <span className="text-xs text-slate-400">{c.hospitalName}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Diagnosis:</span>
                        <span className="font-semibold text-slate-800">{c.diagnosis}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Chief Complaint:</span>
                        <span className="text-slate-700">{c.chiefComplaint}</span>
                      </div>
                    </div>

                    {c.clinicalNotes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {c.clinicalNotes}
                      </p>
                    )}

                    {/* Prescriptions */}
                    {c.prescriptions && c.prescriptions.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                          <Pill className="w-3.5 h-3.5 text-indigo-500" />
                          Prescribed Medications:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {c.prescriptions.map((rx: any) => (
                            <div key={rx.id} className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs">
                              <span className="font-bold text-indigo-950 block">{rx.medicationName} ({rx.dosage})</span>
                              <span className="text-[11px] text-indigo-800">{rx.frequency} • {rx.durationDays} days</span>
                              {rx.instructions && (
                                <span className="block text-[10px] text-indigo-600 mt-0.5">{rx.instructions}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
                No physician consultation records logged yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Invoices & Payments */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            Medical Invoices & Insurance Claims ({billsList.length})
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Bill Number</th>
                    <th className="p-3.5">Hospital</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Insurance Coverage</th>
                    <th className="p-3.5">Net Payable</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billsList.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-cyan-800">{b.billNumber}</td>
                      <td className="p-3.5 font-medium text-slate-800">{b.hospitalName}</td>
                      <td className="p-3.5 font-semibold text-slate-700">${b.totalAmount}</td>
                      <td className="p-3.5 text-emerald-600 font-semibold">-${b.insuranceDiscount}</td>
                      <td className="p-3.5 font-bold text-slate-900 text-sm">${b.netPayable}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {b.status !== 'PAID' ? (
                          <button
                            onClick={() => setSelectedBillForPayment(b)}
                            className="px-3 py-1 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 shadow-2xs"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Modal */}
          {selectedBillForPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Settle Medical Invoice</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Invoice {selectedBillForPayment.billNumber} • {selectedBillForPayment.hospitalName}
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Total:</span>
                    <span className="font-semibold">${selectedBillForPayment.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Insurance Claim Discount:</span>
                    <span>-${selectedBillForPayment.insuranceDiscount}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Net Amount Due:</span>
                    <span className="text-cyan-700">
                      ${selectedBillForPayment.netPayable - selectedBillForPayment.paidAmount}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <label className="text-xs font-semibold text-slate-700 block">Payment Method:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['UPI', 'CARD', 'NET_BANKING'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                          paymentMethod === m
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBillForPayment(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={paymentLoading}
                    className="flex-1 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 shadow-xs"
                  >
                    {paymentLoading ? 'Processing...' : 'Authorize Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-xl">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Rate Your Hospital Experience</h3>
          <p className="text-xs text-slate-500 mb-4">
            Help other patients make informed healthcare decisions across the network.
          </p>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Hospital</label>
              <select
                required
                value={reviewHospId || ''}
                onChange={(e) => setReviewHospId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Choose Hospital --</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`p-2 rounded-lg border text-sm font-bold flex items-center gap-1 ${
                      reviewRating >= star ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Comments</label>
              <textarea
                rows={3}
                placeholder="Share your thoughts on doctor consultations, triage wait times, staff courtesy..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-cyan-700"
            >
              Post Review
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
