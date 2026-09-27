import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Building2,
  Users,
  Bed,
  Plus,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  Lock,
  ShieldCheck,
  Bell,
  Stethoscope,
  Clock,
} from 'lucide-react';

export const HospitalAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'capacity' | 'insurance' | 'updates' | 'expenses'>('analytics');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [acceptedInsurances, setAcceptedInsurances] = useState<any[]>([]);
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Capacity Form
  const [totalBeds, setTotalBeds] = useState(100);
  const [availableBeds, setAvailableBeds] = useState(20);
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);

  // New Staff Modal
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffRole, setNewStaffRole] = useState<'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'BILLING'>('DOCTOR');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffTempPass, setNewStaffTempPass] = useState('TempPass@123');
  const [newStaffDeptId, setNewStaffDeptId] = useState<number | null>(null);
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');
  const [newStaffQualification, setNewStaffQualification] = useState('');
  const [newStaffFee, setNewStaffFee] = useState(60);
  const [newStaffRoom, setNewStaffRoom] = useState('Room 101');
  const [createdStaffCreds, setCreatedStaffCreds] = useState<any | null>(null);

  // New Update Modal
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateCategory, setUpdateCategory] = useState<'ANNOUNCEMENT' | 'EMERGENCY' | 'BLOOD_DRIVE' | 'FACILITY_UPDATE'>('ANNOUNCEMENT');

  // Link Insurance
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [copayPct, setCopayPct] = useState(10);

  // Expense
  const [expCategory, setExpCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(1000);

  useEffect(() => {
    if (hospitalId) {
      loadHospitalData();
    }
  }, [hospitalId]);

  const loadHospitalData = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('sh_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [aRes, sRes, dRes, insRes, pRes, uRes] = await Promise.all([
        fetch(`/api/analytics/hospital/${hospitalId}`, { headers }),
        fetch(`/api/staff/hospital/${hospitalId}`, { headers }),
        fetch(`/api/hospitals/${hospitalId}/departments`),
        fetch(`/api/insurance/hospital/${hospitalId}`),
        fetch(`/api/insurance/providers`),
        fetch(`/api/updates?hospitalId=${hospitalId}`),
      ]);

      if (aRes.ok) {
        const a = await aRes.json();
        setAnalytics(a);
        setTotalBeds(a.hospital.totalBeds);
        setAvailableBeds(a.hospital.availableBeds);
        setEmergencyAvailable(a.hospital.emergencyAvailable);
      }
      if (sRes.ok) setStaffList(await sRes.json());
      if (dRes.ok) {
        const depts = await dRes.json();
        setDepartments(depts);
        if (depts.length > 0) setNewStaffDeptId(depts[0].id);
      }
      if (insRes.ok) setAcceptedInsurances(await insRes.json());
      if (pRes.ok) setAllProviders(await pRes.json());
      if (uRes.ok) setUpdates(await uRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/hospitals/${hospitalId}/beds`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totalBeds, availableBeds, emergencyAvailable }),
      });
      if (res.ok) {
        setStatusMsg('Hospital bed capacity and emergency status updated.');
        loadHospitalData();
      }
    } catch {
      setStatusMsg('Failed to update capacity.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/staff/hospital/${hospitalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newStaffUsername,
          email: newStaffEmail,
          fullName: newStaffFullName,
          phone: newStaffPhone,
          role: newStaffRole,
          temporaryPassword: newStaffTempPass,
          departmentId: newStaffRole === 'DOCTOR' ? newStaffDeptId : undefined,
          specialty: newStaffRole === 'DOCTOR' ? newStaffSpecialty : undefined,
          qualification: newStaffRole === 'DOCTOR' ? newStaffQualification : undefined,
          consultationFee: newStaffRole === 'DOCTOR' ? newStaffFee : undefined,
          roomNumber: newStaffRoom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create staff account.');
      }

      setCreatedStaffCreds(data);
      setShowAddStaff(false);
      setStatusMsg(`Staff account created for ${data.fullName} (${data.role}). Temporary password set.`);
      loadHospitalData();
    } catch (err: any) {
      setStatusMsg(err.message || 'Staff creation failed.');
    }
  };

  const handleLinkInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) return;

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/insurance/hospital/${hospitalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId: selectedProviderId,
          isCashlessSupported: true,
          copayPercentage: copayPct,
        }),
      });

      if (res.ok) {
        setStatusMsg('Insurance provider linked with cashless admission support.');
        loadHospitalData();
      }
    } catch {
      setStatusMsg('Failed to link insurance.');
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/updates/hospital/${hospitalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: updateTitle,
          content: updateContent,
          category: updateCategory,
          isPublic: true,
        }),
      });

      if (res.ok) {
        setShowAddUpdate(false);
        setUpdateTitle('');
        setUpdateContent('');
        setStatusMsg('Hospital announcement posted publicly.');
        loadHospitalData();
      }
    } catch {
      setStatusMsg('Failed to post update.');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/analytics/hospital-expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: expCategory,
          description: expDesc,
          amount: expAmount,
          expenseDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        setStatusMsg('Hospital operational expense logged.');
        setExpCategory('');
        setExpDesc('');
        loadHospitalData();
      }
    } catch {
      setStatusMsg('Failed to record expense.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
              Hospital Admin
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Tenant ID #{hospitalId} • Restricted to this Facility
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">
            {analytics?.hospital?.name || `Hospital Administration #${hospitalId}`}
          </h1>
          <p className="text-xs text-slate-400">
            {analytics?.hospital?.city} • Code: {analytics?.hospital?.code} • {user?.fullName}
          </p>
        </div>

        <button
          onClick={loadHospitalData}
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

      {/* Created Staff Credentials Notice */}
      {createdStaffCreds && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs flex items-start justify-between">
          <div>
            <span className="font-bold block mb-1">New Staff Account Ready:</span>
            <p>
              Username: <strong className="font-mono bg-amber-100 px-1 rounded">{createdStaffCreds.username}</strong> | Temporary Password: <strong className="font-mono bg-amber-100 px-1 rounded">{createdStaffCreds.temporaryPassword}</strong>
            </p>
            <span className="text-[11px] text-amber-800 block mt-1">
              Please deliver these credentials securely. Staff will be prompted to change their password on first login.
            </span>
          </div>
          <button onClick={() => setCreatedStaffCreds(null)} className="font-bold text-amber-800">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'analytics', label: 'Hospital Analytics', icon: TrendingUp },
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'capacity', label: 'Beds & Emergency Capacity', icon: Bed },
          { id: 'insurance', label: 'Cashless Insurance Tie-ups', icon: ShieldCheck },
          { id: 'updates', label: 'Hospital Bulletins', icon: Bell },
          { id: 'expenses', label: 'Hospital Expenses', icon: DollarSign },
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

      {/* TAB 1: Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Appointments</span>
              <span className="text-3xl font-black text-slate-900 block my-1 font-mono">
                {analytics.metrics.totalAppointments}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {analytics.metrics.completedAppointments} Completed
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Collected Revenue</span>
              <span className="text-3xl font-black text-emerald-600 block my-1 font-mono">
                ${analytics.metrics.totalCollected.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold">
                ${analytics.metrics.totalPending.toLocaleString()} Pending Bills
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Bed Occupancy</span>
              <span className="text-3xl font-black text-cyan-600 block my-1 font-mono">
                {analytics.metrics.bedOccupancyRate}%
              </span>
              <span className="text-[11px] text-slate-500">
                {analytics.metrics.availableBeds} beds available
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Avg Queue Wait Time</span>
              <span className="text-3xl font-black text-indigo-600 block my-1 font-mono">
                ~{analytics.metrics.avgWaitMinutes}m
              </span>
              <span className="text-[11px] text-slate-500">Across outpatient clinics</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Staff Management */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hospital Staff Directory ({staffList.length})</h3>
              <p className="text-xs text-slate-500">
                Hospital Administrators can create Doctors, Nurses, Receptionists, and Billing personnel.
              </p>
            </div>

            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Staff Member</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Password Status</th>
                    <th className="p-3.5">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-900">{st.fullName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {st.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-800">{st.username}</td>
                      <td className="p-3.5 text-slate-500">{st.email}</td>
                      <td className="p-3.5">
                        {st.mustChangePassword ? (
                          <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                            Pending First Login Reset
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bed & Emergency Capacity */}
      {activeTab === 'capacity' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-xl">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Manage Hospital Capacity</h3>
          <p className="text-xs text-slate-500 mb-6">
            Keep patients and the network informed of real-time bed availability and ER triage readiness.
          </p>

          <form onSubmit={handleUpdateCapacity} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Hospital Beds
                </label>
                <input
                  type="number"
                  required
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currently Available Beds
                </label>
                <input
                  type="number"
                  required
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">24/7 Emergency Ward Available</span>
                <span className="text-[11px] text-slate-500">Show emergency trauma readiness badge on public directory</span>
              </div>
              <input
                type="checkbox"
                checked={emergencyAvailable}
                onChange={(e) => setEmergencyAvailable(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Save Capacity Changes
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Cashless Insurance Tie-ups */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Accepted Cashless Insurances ({acceptedInsurances.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acceptedInsurances.map((ins) => (
              <div key={ins.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                  {ins.providerCode}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{ins.providerName}</h4>
                <div className="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-100">
                  <span>Cashless Supported: <strong>Yes</strong></span>
                  <span>Patient Copay: <strong>{ins.copayPercentage}%</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Link Provider */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 max-w-md">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Link Another Insurance Provider</h4>
            <form onSubmit={handleLinkInsurance} className="space-y-3">
              <select
                required
                value={selectedProviderId || ''}
                onChange={(e) => setSelectedProviderId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="">-- Choose Insurance Provider --</option>
                {allProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Standard Patient Copay (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={copayPct}
                  onChange={(e) => setCopayPct(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700"
              >
                Link to Hospital
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: Hospital Updates */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Hospital Bulletins & News ({updates.length})</h3>
            <button
              onClick={() => setShowAddUpdate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Bulletin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {updates.map((up) => (
              <div key={up.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-50 text-cyan-800">
                    {up.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(up.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{up.title}</h4>
                <p className="text-xs text-slate-600">{up.content}</p>
              </div>
            ))}
          </div>

          {/* Post Bulletin Modal */}
          {showAddUpdate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Post Hospital Bulletin</h3>
                <form onSubmit={handlePostUpdate} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Headline Title"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <select
                    value={updateCategory}
                    onChange={(e) => setUpdateCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="ANNOUNCEMENT">General Announcement</option>
                    <option value="EMERGENCY">Emergency Notice</option>
                    <option value="BLOOD_DRIVE">Blood Donation Drive</option>
                    <option value="FACILITY_UPDATE">Facility / Equipment Update</option>
                  </select>
                  <textarea
                    rows={4}
                    required
                    placeholder="Details to announce to patients and visitors..."
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUpdate(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                    >
                      Publish Bulletin
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Hospital Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Hospital Operational Expenses</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Log Hospital Expense</h4>
              <form onSubmit={handleAddExpense} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Category (e.g. Surgical Consumables)"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder="Expense Details / Supplier"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="number"
                  required
                  placeholder="Amount ($)"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700"
                >
                  Record Expense
                </button>
              </form>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Recent Logged Expenses</h4>
              <div className="space-y-2">
                {analytics?.expenses?.map((e: any) => (
                  <div key={e.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{e.category}</span>
                      <span className="text-[11px] text-slate-500">{e.description}</span>
                    </div>
                    <span className="font-bold text-slate-900">${e.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Staff Member Account</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provision account credentials with mandatory first-login password change.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Role *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewStaffRole(r)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center ${
                        newStaffRole === r
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl lowercase"
                />
                <input
                  type="email"
                  required
                  placeholder="Official Email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Legal Name"
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffTempPass}
                  onChange={(e) => setNewStaffTempPass(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              {/* Doctor Details */}
              {newStaffRole === 'DOCTOR' && (
                <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newStaffDeptId || ''}
                      onChange={(e) => setNewStaffDeptId(Number(e.target.value))}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Consultation Fee ($)"
                      value={newStaffFee}
                      onChange={(e) => setNewStaffFee(Number(e.target.value))}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Specialty (e.g. Cardiology)"
                      value={newStaffSpecialty}
                      onChange={(e) => setNewStaffSpecialty(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Qualification (e.g. MD, FACC)"
                      value={newStaffQualification}
                      onChange={(e) => setNewStaffQualification(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
