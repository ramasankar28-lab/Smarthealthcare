import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Stethoscope,
  Lock,
  User,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface StaffLoginPageProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ onNavigate }) => {
  const { login, updateUserPasswordResetState } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First Login Temporary Password Reset State
  const [isFirstLoginChange, setIsFirstLoginChange] = useState(false);
  const [tempUserPayload, setTempUserPayload] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const routeStaffToRoleDashboard = (role: string) => {
    switch (role) {
      case 'HOSPITAL_ADMIN':
        onNavigate('hospital-admin-dashboard');
        break;
      case 'DOCTOR':
        onNavigate('doctor-dashboard');
        break;
      case 'NURSE':
        onNavigate('nurse-dashboard');
        break;
      case 'RECEPTIONIST':
        onNavigate('receptionist-dashboard');
        break;
      case 'BILLING':
        onNavigate('billing-dashboard');
        break;
      default:
        onNavigate('landing');
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your staff username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      login(data.token, data.user);

      // Check if temporary password must be changed
      if (data.mustChangePassword) {
        setTempUserPayload(data.user);
        setIsFirstLoginChange(true);
        return;
      }

      routeStaffToRoleDashboard(data.user.role);
    } catch (err: any) {
      setError(err.message || 'Staff login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTempPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update temporary password.');
      }

      updateUserPasswordResetState(false);
      setIsFirstLoginChange(false);
      if (tempUserPayload) {
        routeStaffToRoleDashboard(tempUserPayload.role);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set new password.');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-slate-800 shadow-2xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Hospital Staff Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            Unified single sign-on for Hospital Administrators, Doctors, Nurses, Receptionists, and Billing personnel.
          </p>
        </div>

        {/* Quick Demo Staff Credential Selector */}
        {!isFirstLoginChange && (
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
            <span className="font-bold text-slate-900 block mb-1">
              Select Demo Staff Credentials (H001 Metro General):
            </span>
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => autofill('admin_h001', 'MetroAdmin@123')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-cyan-800 font-semibold truncate"
              >
                Hosp Admin: admin_h001
              </button>
              <button
                type="button"
                onClick={() => autofill('dr_jenkins', 'Doctor@123')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-cyan-800 font-semibold truncate"
              >
                Doctor: dr_jenkins
              </button>
              <button
                type="button"
                onClick={() => autofill('nurse_elena', 'Nurse@123')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-cyan-800 font-semibold truncate"
              >
                Nurse: nurse_elena
              </button>
              <button
                type="button"
                onClick={() => autofill('rec_lisa', 'Reception@123')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-cyan-800 font-semibold truncate"
              >
                Reception: rec_lisa
              </button>
              <button
                type="button"
                onClick={() => autofill('bill_mark', 'Billing@123')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-cyan-800 font-semibold truncate col-span-2"
              >
                Billing Staff: bill_mark
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isFirstLoginChange ? (
          /* Temporary Password Change Requirement */
          <form onSubmit={handleChangeTempPassword} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">First-Time Login Security Requirement</span>
                <span>You are logging in with a temporary password. Please establish your private password to proceed.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password & Continue'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
          </form>
        ) : (
          /* Normal Staff Login Form */
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. dr_jenkins, admin_h001, nurse_elena"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Staff Portal'}</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </form>
        )}

        {/* Information Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Staff accounts are provisioned exclusively by Hospital Administration. Self-registration is restricted.
          </p>
        </div>
      </div>
    </div>
  );
};
