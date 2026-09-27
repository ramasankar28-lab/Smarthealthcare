import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  HeartPulse,
  AlertTriangle,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface ProfileTabProps {
  onProfileUpdated?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onProfileUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('OTHER');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/patient/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch patient profile.');
      const data = await res.json();

      setFullName(data.user.fullName || '');
      setUsername(data.user.username || '');
      setEmail(data.user.email || '');
      setPhone(data.user.phone || '');
      if (data.profile) {
        setDob(data.profile.dob || '');
        setGender(data.profile.gender || 'OTHER');
        setAddress(data.profile.address || '');
        setBloodGroup(data.profile.bloodGroup || 'O+');
        setEmergencyContact(data.profile.emergencyContact || '');
        setAllergies(data.profile.allergies || '');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/patient/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone,
          dob,
          gender,
          address,
          bloodGroup,
          emergencyContact,
          allergies,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update profile.');

      setSuccessMsg('Patient profile updated successfully in PostgreSQL database.');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      setError(err.message || 'Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 mx-auto" />
        <p className="text-xs">Loading patient demographics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Patient Profile & Demographics</h2>
          <p className="text-xs text-slate-500">
            Review and keep your personal contact, medical alerts, and emergency contact up-to-date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadProfile}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-xs"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 border-b border-slate-100 pb-2">
              Identity & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username (System ID)</label>
                <input
                  type="text"
                  disabled
                  value={username}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 border-b border-slate-100 pb-2 pt-2">
              Clinical & Emergency Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Non-Binary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white font-bold text-red-700"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Info</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse: +1 (555) 019-2834"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies / Alerts</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Latex, Peanuts"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <textarea
                rows={2}
                placeholder="Street address, apartment, city, zip code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Right: Digital Health ID Card */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-800/40 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">Digital Patient ID</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">HIPAA SECURE</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 uppercase">Patient Name</span>
              <h4 className="text-base font-bold text-white">{fullName || 'Patient Name'}</h4>
              <p className="text-xs text-slate-300 font-mono">ID: {username || 'PT-XXXX'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-800/40 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Blood Group</span>
                <span className="font-bold text-red-400 text-sm">{bloodGroup || 'O+'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Emergency Contact</span>
                <span className="font-medium text-slate-200 text-[11px] line-clamp-1">
                  {emergencyContact || 'Not recorded'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 border-t border-cyan-800/40">
              Valid across all connected network hospitals, emergency trauma bays, and outpatient clinics.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-cyan-600" /> Patient Rights & Consent
            </h4>
            <p className="text-[11px] leading-relaxed">
              Your medical records, vitals, and consultation histories are stored in accordance with federal data privacy standards. Only authorized medical staff at treating hospitals have access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
