import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage, Language } from '../context/LanguageContext.tsx';
import {
  Activity,
  User,
  ShieldAlert,
  LogOut,
  Globe,
  LayoutDashboard,
  Clock,
  Building2,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const getDashboardViewForRole = (role?: string) => {
    switch (role) {
      case 'PATIENT':
        return 'patient-dashboard';
      case 'HOSPITAL_ADMIN':
        return 'hospital-admin-dashboard';
      case 'DOCTOR':
        return 'doctor-dashboard';
      case 'NURSE':
        return 'nurse-dashboard';
      case 'RECEPTIONIST':
        return 'receptionist-dashboard';
      case 'BILLING':
        return 'billing-dashboard';
      case 'CENTRAL_ADMIN':
        return 'platform-admin-dashboard';
      default:
        return 'landing';
    }
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate(user ? getDashboardViewForRole(user.role) : 'landing')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-cyan-700 transition-colors">
                SMART <span className="text-cyan-600 font-extrabold">HEALTHCARE</span>
              </span>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Multi-Hospital Network
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('landing')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'landing' ? 'text-cyan-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-600" />
                {t.findHospitals}
              </span>
            </button>

            <button
              onClick={() => onNavigate('track-queue')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'track-queue' ? 'text-cyan-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                {t.trackQueue}
              </span>
            </button>

            <button
              onClick={() => onNavigate('assistant')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'assistant' ? 'text-cyan-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                {t.multilingualAssistant}
              </span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                title="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{languages.find((l) => l.code === language)?.label}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        language === l.code ? 'font-semibold text-cyan-600 bg-cyan-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{l.label}</span>
                      <span>{l.flag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Session States */}
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate(getDashboardViewForRole(user.role))}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Dashboard</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-100 text-cyan-800">
                    {user.role.replace('_', ' ')}
                  </span>
                </button>

                <div className="text-right leading-tight">
                  <div className="text-xs font-bold text-slate-900 max-w-[130px] truncate">{user.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">@{user.username}</div>
                </div>

                <button
                  onClick={async () => {
                    await logout();
                    onNavigate('landing');
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onNavigate('patient-login')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors shadow-2xs"
                >
                  {t.continueAsPatient}
                </button>

                <button
                  onClick={() => onNavigate('staff-login')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  {t.continueAsStaff}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-5 space-y-3">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-slate-700 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-cyan-600" />
            {t.findHospitals}
          </button>

          <button
            onClick={() => {
              onNavigate('track-queue');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-slate-700 flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-teal-600" />
            {t.trackQueue}
          </button>

          <button
            onClick={() => {
              onNavigate('assistant');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-slate-700 flex items-center gap-2"
          >
            <Globe className="w-4 h-4 text-indigo-500" />
            {t.multilingualAssistant}
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Language:</span>
            <div className="flex gap-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 text-xs rounded ${language === l.code ? 'bg-cyan-600 text-white' : 'bg-slate-100'}`}
                >
                  {l.flag}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onNavigate(getDashboardViewForRole(user.role));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-cyan-600 text-white text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Dashboard ({user.role})
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    onNavigate('landing');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onNavigate('patient-login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 text-center text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-700"
                >
                  {t.continueAsPatient}
                </button>
                <button
                  onClick={() => {
                    onNavigate('staff-login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 text-center text-xs font-semibold rounded-lg bg-slate-900 text-white"
                >
                  {t.continueAsStaff}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
