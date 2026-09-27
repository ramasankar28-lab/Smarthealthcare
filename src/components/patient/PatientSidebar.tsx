import React from 'react';
import {
  LayoutDashboard,
  User,
  Search,
  CalendarPlus,
  CalendarCheck,
  Radio,
  CreditCard,
  ShieldCheck,
  FileHeart,
  MessageSquare,
  Star,
  Sparkles,
  X,
} from 'lucide-react';

export type PatientNavTab =
  | 'dashboard'
  | 'profile'
  | 'find-hospital'
  | 'book-appointment'
  | 'my-appointments'
  | 'live-tracking'
  | 'bills-payments'
  | 'insurance-hospitals'
  | 'medical-records'
  | 'messages'
  | 'reviews'
  | 'smartcare';

interface PatientSidebarProps {
  activeTab: PatientNavTab;
  onSelectTab: (tab: PatientNavTab) => void;
  pendingBillsCount?: number;
  upcomingAptsCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: PatientNavTab; label: string; icon: React.ComponentType<{ className?: string }>; badgeKey?: 'bills' | 'apts' }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'find-hospital', label: 'Find Hospital', icon: Search },
  { id: 'book-appointment', label: 'Book Appointment', icon: CalendarPlus },
  { id: 'my-appointments', label: 'My Appointments', icon: CalendarCheck, badgeKey: 'apts' },
  { id: 'live-tracking', label: 'Live Tracking', icon: Radio },
  { id: 'bills-payments', label: 'Bills & Payments', icon: CreditCard, badgeKey: 'bills' },
  { id: 'insurance-hospitals', label: 'Insurance Hospitals', icon: ShieldCheck },
  { id: 'medical-records', label: 'Medical Records', icon: FileHeart },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'smartcare', label: 'SmartCare', icon: Sparkles },
];

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingBillsCount = 0,
  upcomingAptsCount = 0,
  isOpenMobile,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Patient Portal</span>
          <h2 className="text-sm font-semibold text-slate-900">Health Navigation</h2>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badgeCount =
            item.badgeKey === 'bills'
              ? pendingBillsCount
              : item.badgeKey === 'apts'
                ? upcomingAptsCount
                : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-cyan-50 text-cyan-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.badgeKey === 'bills'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-cyan-100 text-cyan-800'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{content}</div>
        </div>
      )}
    </>
  );
};
