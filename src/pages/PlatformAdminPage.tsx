import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lock,
  User,
  Plus,
  RefreshCw,
  LogOut,
  FileText,
  Bed,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';

interface PlatformAdminPageProps {
  onNavigate: (view: string) => void;
}

export const PlatformAdminPage: React.FC<PlatformAdminPageProps> = ({ onNavigate }) => {
  const { user, login, logout } = useAuth();

  // Login form state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('Admin@12345');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Portal Tab state
  const [activeTab, setActiveTab] = useState<'kpi' | 'hospitals' | 'insurance' | 'expenses' | 'audit'>('kpi');
  const [overview, setOverview] = useState<any | null>(null);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [providersList, setProvidersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Hospital Modal
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospCode, setNewHospCode] = useState('');
  const [newHospName, setNewHospName] = useState('');
  const [newHospCity, setNewHospCity] = useState('');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospPhone, setNewHospPhone] = useState('');
  const [newHospEmail, setNewHospEmail] = useState('');
  const [newHospBeds, setNewHospBeds] = useState(120);

  // New Insurance Provider Modal
  const [showAddInsurance, setShowAddInsurance] = useState(false);
  const [insName, setInsName] = useState('');
  const [insCode, setInsCode] = useState('');
  const [insCoverage, setInsCoverage] = useState('');
  const [insContact, setInsContact] = useState('');

  // New Platform Expense Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(500);

  const isCentralAdmin = user && user.role === 'CENTRAL_ADMIN';

  useEffect(() => {
    if (isCentralAdmin) {
      loadAdminData();
    }
  }, [isCentralAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sh_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, hospRes, insRes] = await Promise.all([
        fetch('/api/analytics/platform', { headers }),
        fetch('/api/hospitals?status='),
        fetch('/api/insurance/providers'),
      ]);

      if (statsRes.ok) setOverview(await statsRes.json());
      if (hospRes.ok) setHospitalsList(await hospRes.json());
      if (insRes.ok) setProvidersList(await insRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/platform-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }
      login(data.token, data.user);
    } catch (err: any) {
      setLoginError(err.message || 'Administrator login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleToggleHospitalStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/hospitals/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setStatusMessage(`Hospital status updated to ${nextStatus}.`);
        loadAdminData();
      }
    } catch {
      setStatusMessage('Failed to update hospital status.');
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newHospCode,
          name: newHospName,
          city: newHospCity,
          address: newHospAddress,
          phone: newHospPhone,
          email: newHospEmail,
          totalBeds: newHospBeds,
          availableBeds: Math.round(newHospBeds * 0.2),
          emergencyAvailable: true,
        }),
      });
      if (res.ok) {
        setShowAddHospital(false);
        setStatusMessage('Hospital created and registered in the network.');
        loadAdminData();
      }
    } catch {
      setStatusMessage('Failed to create hospital.');
    }
  };

  const handleCreateInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/insurance/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: insName,
          code: insCode,
          coverageType: insCoverage,
          supportContact: insContact,
        }),
      });
      if (res.ok) {
        setShowAddInsurance(false);
        setStatusMessage('Insurance provider added to master directory.');
        loadAdminData();
      }
    } catch {
      setStatusMessage('Failed to add provider.');
    }
  };

  const handleAddPlatformExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/analytics/platform-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: expCategory,
          description: expDesc,
          amount: expAmount,
          recordedDate: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        setShowAddExpense(false);
        setStatusMessage('Platform expense recorded.');
        loadAdminData();
      }
    } catch {
      setStatusMessage('Failed to record expense.');
    }
  };

  // If not authenticated as CENTRAL_ADMIN, show dedicated protected login
  if (!isCentralAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl text-slate-100">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-cyan-500/30 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Central Admin Entry Point</h2>
            <p className="text-xs text-slate-400 mt-1">
              Protected platform-level administration for network governance, financials, and hospital onboarding.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Central Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{loginLoading ? 'Authenticating...' : 'Access Central Administration'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700 text-center text-[10px] text-slate-400">
            Note: This route is strictly confidential and restricted to platform leadership.
          </div>
        </div>
      </div>
    );
  }

  // Central Admin Control Center
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Central Administration
            </span>
            <span className="text-xs text-slate-400">Governance Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Platform Control Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as {user.fullName} ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              onNavigate('landing');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'kpi', label: 'Network KPIs & Analytics', icon: TrendingUp },
          { id: 'hospitals', label: 'Hospital Directory & Status', icon: Building2 },
          { id: 'insurance', label: 'Insurance Master Directory', icon: ShieldCheck },
          { id: 'expenses', label: 'Platform Expenses', icon: DollarSign },
          { id: 'audit', label: 'Network Audit Trail', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Network KPIs */}
      {activeTab === 'kpi' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Total Network Hospitals</span>
              <span className="text-3xl font-black text-slate-900 block my-1 font-mono">
                {overview.networkKPIs.totalHospitals}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {overview.networkKPIs.activeHospitals} Active in operation
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Patients & Medical Staff</span>
              <span className="text-3xl font-black text-cyan-600 block my-1 font-mono">
                {overview.networkKPIs.patientCount} <span className="text-xs text-slate-400 font-normal">pts</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {overview.networkKPIs.doctorCount} Doctors • {overview.networkKPIs.totalStaff} Total Staff
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Aggregated Gross Revenue</span>
              <span className="text-3xl font-black text-emerald-600 block my-1 font-mono">
                ${overview.networkKPIs.totalGrossRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">
                Expenses: ${overview.networkKPIs.totalExpenses.toLocaleString()}
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Bed Capacity & Occupancy</span>
              <span className="text-3xl font-black text-indigo-600 block my-1 font-mono">
                {overview.networkKPIs.bedOccupancyRate}%
              </span>
              <span className="text-[11px] text-slate-500">
                {overview.networkKPIs.availableBeds} beds available / {overview.networkKPIs.totalBeds} total
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hospitals Management */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Registered Hospitals ({hospitalsList.length})</h3>
            <button
              onClick={() => setShowAddHospital(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Hospital</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Hospital Name</th>
                    <th className="p-3.5">City & Contact</th>
                    <th className="p-3.5">Beds (Avail/Total)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hospitalsList.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold font-mono text-cyan-800">{h.code}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{h.name}</span>
                        <span className="text-[11px] text-slate-400">{h.email}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-800 block">{h.city}</span>
                        <span className="text-[11px] text-slate-400">{h.phone}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-600">{h.availableBeds}</span> / {h.totalBeds}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleHospitalStatus(h.id, h.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            h.status === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {h.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Insurance Master Directory */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Insurance Master Directory ({providersList.length})
            </h3>
            <button
              onClick={() => setShowAddInsurance(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Insurance Provider</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providersList.map((ins) => (
              <div key={ins.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 font-mono">
                    {ins.code}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Active</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{ins.name}</h4>
                <p className="text-xs text-slate-500">{ins.coverageType}</p>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  Support: {ins.supportContact || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Platform Expenses */}
      {activeTab === 'expenses' && overview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Recorded Platform Expenses (${overview.networkKPIs.totalExpenses.toLocaleString()})
            </h3>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Recorded By</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono text-slate-500">{exp.recordedDate}</td>
                    <td className="p-3.5 font-bold text-slate-900">{exp.category}</td>
                    <td className="p-3.5 text-slate-600">{exp.description}</td>
                    <td className="p-3.5 text-slate-500">{exp.recordedBy}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      ${exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Trail */}
      {activeTab === 'audit' && overview && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Network Security Audit Trail</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Resource</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.recentAuditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-cyan-700">{log.action}</td>
                    <td className="p-3.5 font-mono text-slate-500">{log.resource}</td>
                    <td className="p-3.5 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Onboard Hospital</h3>
            <form onSubmit={handleCreateHospital} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Code (e.g. H004)"
                  value={newHospCode}
                  onChange={(e) => setNewHospCode(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newHospCity}
                  onChange={(e) => setNewHospCity(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Hospital Name"
                value={newHospName}
                onChange={(e) => setNewHospName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Full Street Address"
                value={newHospAddress}
                onChange={(e) => setNewHospAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={newHospPhone}
                  onChange={(e) => setNewHospPhone(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={newHospEmail}
                  onChange={(e) => setNewHospEmail(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Total Bed Capacity</label>
                <input
                  type="number"
                  value={newHospBeds}
                  onChange={(e) => setNewHospBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHospital(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  Register Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Insurance Provider Modal */}
      {showAddInsurance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Insurance Provider</h3>
            <form onSubmit={handleCreateInsurance} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Provider Name (e.g. Cigna Global)"
                value={insName}
                onChange={(e) => setInsName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Code (e.g. CIGNA)"
                value={insCode}
                onChange={(e) => setInsCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Coverage Type (e.g. Comprehensive Inpatient)"
                value={insCoverage}
                onChange={(e) => setInsCoverage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Support Contact / Phone"
                value={insContact}
                onChange={(e) => setInsContact(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInsurance(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  Add Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Platform Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Platform Expense</h3>
            <form onSubmit={handleAddPlatformExpense} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Category (e.g. Cloud Database)"
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Description"
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
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
