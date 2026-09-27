import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Bed,
  Star,
  ShieldCheck,
  CalendarPlus,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import type { PatientNavTab } from './PatientSidebar.tsx';

interface FindHospitalTabProps {
  onSelectHospitalForBooking: (hospitalId: number) => void;
}

export const FindHospitalTab: React.FC<FindHospitalTabProps> = ({
  onSelectHospitalForBooking,
}) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const fetchHospitals = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/hospitals?status=ACTIVE';
      if (selectedCity) url += `&city=${encodeURIComponent(selectedCity)}`;
      if (emergencyOnly) url += '&emergencyOnly=true';
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch hospital directory.');
      const data = await res.json();
      setHospitals(data);
    } catch (err: any) {
      setError(err.message || 'Error loading hospitals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [selectedCity, emergencyOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals();
  };

  const cities = Array.from(new Set(hospitals.map((h) => h.city))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hospital & Trauma Center Directory</h2>
          <p className="text-xs text-slate-500">
            Discover accredited hospitals, emergency trauma facilities, and live bed capacities across the network.
          </p>
        </div>
        <button
          onClick={fetchHospitals}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-xs self-start sm:self-auto"
          title="Refresh Directory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by hospital name, specialty, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
              className="rounded text-cyan-600 focus:ring-cyan-500"
            />
            <span>24/7 Level-1 Emergency & Trauma Only</span>
          </label>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
          <p className="text-xs text-red-800">{error}</p>
          <button
            onClick={fetchHospitals}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-xl" />
          <div className="h-44 bg-slate-200 rounded-xl" />
        </div>
      )}

      {/* Empty State */}
      {!loading && hospitals.length === 0 && !error && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No matching hospitals found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing city filter, or disabling emergency-only filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCity('');
              setEmergencyOnly(false);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Hospital List */}
      {!loading && hospitals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-cyan-500 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                      {h.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{h.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {h.address}, {h.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{h.rating}</span>
                  </div>
                </div>

                {h.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{h.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-slate-400" />
                    <span>
                      Available Beds: <strong className="text-slate-900">{h.availableBeds}</strong> / {h.totalBeds}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{h.phone}</span>
                  </div>
                </div>

                {h.emergencyAvailable && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>24/7 Level-1 Emergency & Trauma Care Available</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Affiliated Network Hospital</span>
                <button
                  onClick={() => onSelectHospitalForBooking(h.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Book Here
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
