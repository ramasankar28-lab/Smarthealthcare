import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { PatientLoginPage } from './pages/PatientLoginPage.tsx';
import { PatientRegisterPage } from './pages/PatientRegisterPage.tsx';
import { StaffLoginPage } from './pages/StaffLoginPage.tsx';
import { PlatformAdminPage } from './pages/PlatformAdminPage.tsx';
import { PatientDashboard } from './pages/patient/PatientDashboard.tsx';
import { HospitalAdminDashboard } from './pages/staff/HospitalAdminDashboard.tsx';
import { DoctorDashboard } from './pages/staff/DoctorDashboard.tsx';
import { NurseDashboard } from './pages/staff/NurseDashboard.tsx';
import { ReceptionistDashboard } from './pages/staff/ReceptionistDashboard.tsx';
import { BillingDashboard } from './pages/staff/BillingDashboard.tsx';
import { QueueTrackerWidget } from './components/QueueTrackerWidget.tsx';
import { MultilingualAssistantModal } from './components/MultilingualAssistantModal.tsx';
import { Activity } from 'lucide-react';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewExtra, setViewExtra] = useState<any>(null);

  // Sync initial view from URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/platform-admin') {
      setCurrentView('platform-admin');
    } else if (path === '/patient-login') {
      setCurrentView('patient-login');
    } else if (path === '/staff-login') {
      setCurrentView('staff-login');
    } else if (path === '/patient-register') {
      setCurrentView('patient-register');
    } else if (path === '/track-queue') {
      setCurrentView('track-queue');
    } else if (path === '/assistant') {
      setCurrentView('assistant');
    }
  }, []);

  const handleNavigate = (view: string, extra?: any) => {
    setCurrentView(view);
    setViewExtra(extra || null);

    // Update browser history URL
    let path = '/';
    if (view === 'platform-admin') path = '/platform-admin';
    else if (view === 'patient-login') path = '/patient-login';
    else if (view === 'staff-login') path = '/staff-login';
    else if (view === 'patient-register') path = '/patient-register';
    else if (view === 'track-queue') path = '/track-queue';
    else if (view === 'assistant') path = '/assistant';

    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If loading session on first visit
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
            <Activity className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Connecting to Smart Healthcare Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* Universal Navbar */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}

        {currentView === 'patient-login' && <PatientLoginPage onNavigate={handleNavigate} />}

        {currentView === 'patient-register' && <PatientRegisterPage onNavigate={handleNavigate} />}

        {currentView === 'staff-login' && <StaffLoginPage onNavigate={handleNavigate} />}

        {currentView === 'platform-admin' && <PlatformAdminPage onNavigate={handleNavigate} />}

        {currentView === 'patient-dashboard' && (
          <PatientDashboard
            initialAction={viewExtra?.action}
            initialHospitalId={viewExtra?.hospitalId}
          />
        )}

        {currentView === 'hospital-admin-dashboard' && <HospitalAdminDashboard />}

        {currentView === 'doctor-dashboard' && <DoctorDashboard />}

        {currentView === 'nurse-dashboard' && <NurseDashboard />}

        {currentView === 'receptionist-dashboard' && <ReceptionistDashboard />}

        {currentView === 'billing-dashboard' && <BillingDashboard />}

        {currentView === 'track-queue' && (
          <div className="max-w-4xl mx-auto px-4 py-10">
            <QueueTrackerWidget />
          </div>
        )}

        {currentView === 'assistant' && (
          <div className="max-w-4xl mx-auto px-4 py-10">
            <MultilingualAssistantModal />
          </div>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">SMART HEALTHCARE NETWORK</span>
            <span>• HIPAA Compliant Multi-Hospital Architecture</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => handleNavigate('landing')} className="hover:text-slate-800">
              Hospital Directory
            </button>
            <button onClick={() => handleNavigate('track-queue')} className="hover:text-slate-800">
              Live Queue Tracker
            </button>
            <button onClick={() => handleNavigate('assistant')} className="hover:text-slate-800">
              Multilingual Assistance
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
