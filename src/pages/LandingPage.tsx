import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { HospitalCard, HospitalData } from '../components/HospitalCard.tsx';
import { QueueTrackerWidget } from '../components/QueueTrackerWidget.tsx';
import { MultilingualAssistantModal } from '../components/MultilingualAssistantModal.tsx';
import {
  Activity,
  Building2,
  Users,
  Bed,
  ShieldCheck,
  Search,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Bell,
  HeartHandshake,
  CalendarCheck,
  X,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Selected hospital modal
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [hRes, pRes, uRes] = await Promise.all([
        fetch('/api/hospitals'),
        fetch('/api/insurance/providers'),
        fetch('/api/updates'),
      ]);

      if (hRes.ok) setHospitals(await hRes.json());
      if (pRes.ok) setProviders(await pRes.json());
      if (uRes.ok) setUpdates(await uRes.json());
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHospitalModal = async (h: HospitalData) => {
    setModalLoading(true);
    setSelectedHospital(h);
    try {
      const res = await fetch(`/api/hospitals/${h.id}`);
      if (res.ok) {
        setSelectedHospital(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch hospital details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBookFromHospital = (h: HospitalData) => {
    if (!user) {
      onNavigate('patient-login');
    } else if (user.role === 'PATIENT') {
      onNavigate('patient-dashboard', { action: 'book', hospitalId: h.id });
    } else {
      onNavigate('patient-login');
    }
  };

  // Filter hospitals
  const filteredHospitals = hospitals.filter((h) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchCity = h.city.toLowerCase().includes(q);
      const matchAddress = h.address.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchAddress) return false;
    }

    if (selectedCity && h.city !== selectedCity) return false;
    if (emergencyOnly && !h.emergencyAvailable) return false;
    if (selectedInsurance) {
      const hasIns = h.acceptedInsurances?.some(
        (ins) => ins.id.toString() === selectedInsurance
      );
      if (!hasIns) return false;
    }

    return true;
  });

  const cities = Array.from(new Set(hospitals.map((h) => h.city))).filter(Boolean);

  // Compute Network Statistics
  const totalBeds = hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-gradient-to-b from-cyan-50/70 via-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/70 text-cyan-800 text-xs font-semibold mb-4 border border-cyan-200">
              <Activity className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>Unified Multi-Hospital Healthcare Ecosystem</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
              Smart Healthcare for Every Patient & Provider
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Discover verified hospitals, check live bed capacity, track outpatient consultation queues in real-time, and manage appointments and cashless insurance effortlessly.
            </p>

            {/* Public Entry Action Cards (Strictly Patient and Staff, No Central Admin) */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
              <button
                onClick={() => onNavigate('patient-login')}
                className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <span>{t.continueAsPatient}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('staff-login')}
                className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                <span>{t.continueAsStaff}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Network KPIs Strip */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-2xs text-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-slate-900 block font-mono">{hospitals.length}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Connected Hospitals</span>
            </div>

            <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-2xs text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Bed className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-emerald-600 block font-mono">
                {availableBeds} <span className="text-xs font-normal text-slate-400">/ {totalBeds}</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available Beds Now</span>
            </div>

            <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-2xs text-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-slate-900 block font-mono">{providers.length}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Insurance Partners</span>
            </div>

            <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-2xs text-center">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-rose-600 block font-mono">24/7</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Emergency Triage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hospital Discovery Section */}
        <section id="hospitals-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-600 font-semibold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>Hospital Directory & Bed Availability</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Explore Network Hospitals</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Filter by city, accepted cashless insurance, or acute emergency trauma capability.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search text */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t.searchCityOrHospital}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              {/* City filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-700"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Insurance filter */}
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-700"
              >
                <option value="">Any Insurance Coverage</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id.toString()}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>

              {/* Emergency Only Toggle */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-medium text-slate-700">24/7 ER Only</span>
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={(e) => setEmergencyOnly(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {(searchTerm || selectedCity || selectedInsurance || emergencyOnly) && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Showing {filteredHospitals.length} filtered hospitals</span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCity('');
                    setSelectedInsurance('');
                    setEmergencyOnly(false);
                  }}
                  className="text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Hospital Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredHospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHospitals.map((h) => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  onSelect={handleOpenHospitalModal}
                  onBookAppointment={handleBookFromHospital}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No hospitals match your filter criteria</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your insurance or city filters to view all available medical centers.
              </p>
            </div>
          )}
        </section>

        {/* Live Queue Tracker Section */}
        <section id="queue-section">
          <QueueTrackerWidget />
        </section>

        {/* Multilingual Patient Assistance Section */}
        <section id="assistant-section">
          <MultilingualAssistantModal />
        </section>

        {/* Hospital Updates & Public Bulletins */}
        {updates.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Hospital Bulletins & Public Announcements</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {updates.slice(0, 3).map((up) => (
                <div key={up.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                      {up.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(up.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{up.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3">{up.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                  {selectedHospital.code}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedHospital.address}, {selectedHospital.city}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 space-y-5 text-xs text-slate-600">
              <p>{selectedHospital.description}</p>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bed Capacity</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedHospital.availableBeds} / {selectedHospital.totalBeds} Available
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emergency Status</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {selectedHospital.emergencyAvailable ? '24/7 Open' : 'Standard'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient Rating</span>
                  <span className="text-sm font-bold text-amber-600">★ {selectedHospital.rating}</span>
                </div>
              </div>

              {/* Departments */}
              {selectedHospital.departments && selectedHospital.departments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Specialty Departments:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedHospital.departments.map((d: any) => (
                      <div key={d.id} className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <span className="font-semibold text-slate-800 block">{d.name}</span>
                        {d.headDoctorName && (
                          <span className="text-[10px] text-slate-400">Head: {d.headDoctorName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors */}
              {selectedHospital.doctors && selectedHospital.doctors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Attending Physicians:</h4>
                  <div className="space-y-2">
                    {selectedHospital.doctors.map((doc: any) => (
                      <div key={doc.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.fullName}</span>
                          <span className="text-[11px] text-slate-500">
                            {doc.specialty} • {doc.qualification}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                          ${doc.consultationFee} fee
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurances */}
              {selectedHospital.acceptedInsurances && selectedHospital.acceptedInsurances.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Accepted Cashless Insurances:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHospital.acceptedInsurances.map((ins: any) => (
                      <span key={ins.id} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                        {ins.name} ({100 - ins.copayPercentage}% Cashless)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedHospital(null)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const h = selectedHospital;
                  setSelectedHospital(null);
                  handleBookFromHospital(h);
                }}
                className="py-2 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Book Appointment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
