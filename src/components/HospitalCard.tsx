import React from 'react';
import { Building2, MapPin, Phone, ShieldCheck, Bed, Star, ChevronRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export interface HospitalData {
  id: number;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  totalBeds: number;
  availableBeds: number;
  emergencyAvailable: boolean;
  rating: string;
  description?: string;
  acceptedInsurances?: Array<{
    id: number;
    name: string;
    code: string;
    isCashless: boolean;
    copayPercentage: number;
  }>;
  departmentsCount?: number;
}

interface HospitalCardProps {
  hospital: HospitalData;
  onSelect: (hospital: HospitalData) => void;
  onBookAppointment?: (hospital: HospitalData) => void;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  onSelect,
  onBookAppointment,
}) => {
  const { t } = useLanguage();

  const bedRatio = hospital.totalBeds > 0 ? hospital.availableBeds / hospital.totalBeds : 0;
  const bedStatusColor =
    bedRatio > 0.2
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : bedRatio > 0.05
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-cyan-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-slate-100 text-slate-700">
                {hospital.code}
              </span>
              {hospital.emergencyAvailable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  24/7 ER Ready
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-1">
              {hospital.name}
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200/60 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{hospital.rating}</span>
          </div>
        </div>

        {/* Location & Details */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{hospital.address}, {hospital.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{hospital.phone}</span>
          </div>
        </div>

        {/* Beds & Capacity */}
        <div className="grid grid-cols-2 gap-2 py-2.5 px-3 bg-slate-50/80 rounded-xl mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-cyan-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Beds Available</span>
              <span className={`font-bold ${hospital.availableBeds > 5 ? 'text-slate-800' : 'text-rose-600'}`}>
                {hospital.availableBeds} / {hospital.totalBeds}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Departments</span>
              <span className="font-bold text-slate-800">
                {hospital.departmentsCount || 4} Specialties
              </span>
            </div>
          </div>
        </div>

        {/* Accepted Insurances */}
        {hospital.acceptedInsurances && hospital.acceptedInsurances.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cashless Insurance Tie-ups:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hospital.acceptedInsurances.slice(0, 3).map((ins) => (
                <span
                  key={ins.id}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-medium"
                >
                  {ins.code} ({100 - ins.copayPercentage}% Cashless)
                </span>
              ))}
              {hospital.acceptedInsurances.length > 3 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100">
                  +{hospital.acceptedInsurances.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => onSelect(hospital)}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors text-center"
        >
          View Details
        </button>

        {onBookAppointment && (
          <button
            onClick={() => onBookAppointment(hospital)}
            className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
          >
            <span>{t.bookAppointment}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
