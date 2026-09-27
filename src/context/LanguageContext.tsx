import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'hi' | 'ar';

export interface Translations {
  appName: string;
  tagline: string;
  continueAsPatient: string;
  continueAsStaff: string;
  findHospitals: string;
  trackQueue: string;
  emergencyCare: string;
  insuranceSupported: string;
  bookAppointment: string;
  bedsAvailable: string;
  callingToken: string;
  estimatedWait: string;
  login: string;
  logout: string;
  register: string;
  searchCityOrHospital: string;
  selectLanguage: string;
  patientPortal: string;
  staffPortal: string;
  multilingualAssistant: string;
  assistantPrompt: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appName: 'Smart Healthcare Network',
    tagline: 'Connected Multi-Hospital Patient Care & Queue Intelligence',
    continueAsPatient: 'Continue as Patient',
    continueAsStaff: 'Continue as Staff',
    findHospitals: 'Find & Discover Hospitals',
    trackQueue: 'Track Live Queue',
    emergencyCare: '24/7 Emergency Ready',
    insuranceSupported: 'Cashless Insurance Verified',
    bookAppointment: 'Book Appointment',
    bedsAvailable: 'Available Beds',
    callingToken: 'Now Calling Token',
    estimatedWait: 'Est. Wait',
    login: 'Log In',
    logout: 'Sign Out',
    register: 'Create Account',
    searchCityOrHospital: 'Search hospital name, city, or specialty...',
    selectLanguage: 'Language',
    patientPortal: 'Patient Health Portal',
    staffPortal: 'Hospital Staff Portal',
    multilingualAssistant: 'Multilingual Patient Assistance',
    assistantPrompt: 'Need guidance in your preferred language? Explore queue instructions and department routing.',
  },
  es: {
    appName: 'Red de Salud Inteligente',
    tagline: 'Atención Hospitalaria Conectada y Seguimiento de Colas en Tiempo Real',
    continueAsPatient: 'Continuar como Paciente',
    continueAsStaff: 'Continuar como Personal',
    findHospitals: 'Buscar y Explorar Hospitales',
    trackQueue: 'Seguimiento de Cola en Vivo',
    emergencyCare: 'Emergencias 24/7 Disponibles',
    insuranceSupported: 'Seguro Médico Verificado',
    bookAppointment: 'Reservar Cita',
    bedsAvailable: 'Camas Disponibles',
    callingToken: 'Llamando al Turno',
    estimatedWait: 'Espera Estimada',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    register: 'Crear Cuenta',
    searchCityOrHospital: 'Buscar hospital, ciudad o especialidad...',
    selectLanguage: 'Idioma',
    patientPortal: 'Portal del Paciente',
    staffPortal: 'Portal del Personal',
    multilingualAssistant: 'Asistencia al Paciente Multilingüe',
    assistantPrompt: '¿Necesita orientación en su idioma? Consulte indicaciones para citas y colas.',
  },
  fr: {
    appName: 'Réseau Santé Intelligent',
    tagline: 'Soins Multi-Hospitaliers Connectés & Suivi des Files d’Attente',
    continueAsPatient: 'Continuer en tant que Patient',
    continueAsStaff: 'Continuer en tant que Personnel',
    findHospitals: 'Trouver un Hôpital',
    trackQueue: 'Suivre la File en Direct',
    emergencyCare: 'Urgences Ouvertes 24/7',
    insuranceSupported: 'Prise en Charge Assurances',
    bookAppointment: 'Prendre Rendez-vous',
    bedsAvailable: 'Lits Disponibles',
    callingToken: 'Appel du Numéro',
    estimatedWait: 'Attente Estimée',
    login: 'Connexion',
    logout: 'Déconnexion',
    register: 'Créer un Compte',
    searchCityOrHospital: 'Rechercher un hôpital, ville ou spécialité...',
    selectLanguage: 'Langue',
    patientPortal: 'Portail Patient',
    staffPortal: 'Portail Hospitalier',
    multilingualAssistant: 'Assistance Médicale Multilingue',
    assistantPrompt: 'Besoin d’aide dans votre langue ? Consultez le guide d’orientation et de file d’attente.',
  },
  hi: {
    appName: 'स्मार्ट हेल्थकेयर नेटवर्क',
    tagline: 'मल्टी-हॉस्पिटल एकीकृत स्वास्थ्य सेवा और लाइव कतार ट्रैकिंग',
    continueAsPatient: 'मरीज़ के रूप में आगे बढ़ें',
    continueAsStaff: 'स्टाफ के रूप में आगे बढ़ें',
    findHospitals: 'अस्पताल खोजें',
    trackQueue: 'लाइव कतार देखें',
    emergencyCare: '24/7 आपातकालीन सेवा',
    insuranceSupported: 'कैशलेस बीमा समर्थित',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    bedsAvailable: 'उपलब्ध बिस्तर',
    callingToken: 'वर्तमान टोकन नंबर',
    estimatedWait: 'अनुमानित समय',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',
    register: 'नया खाता बनाएं',
    searchCityOrHospital: 'अस्पताल, शहर या विशेषज्ञता खोजें...',
    selectLanguage: 'भाषा',
    patientPortal: 'मरीज़ स्वास्थ्य पोर्टल',
    staffPortal: 'अस्पताल स्टाफ पोर्टल',
    multilingualAssistant: 'बहुभाषी मरीज़ सहायता',
    assistantPrompt: 'अपनी भाषा में मार्गदर्शन प्राप्त करें: कतार निर्देश और विभाग जानकारी।',
  },
  ar: {
    appName: 'شبكة الرعاية الصحية الذكية',
    tagline: 'منظومة متعددة المستشفيات لإدارة رعاية المرضى وتتبع طوابير الانتظار',
    continueAsPatient: 'المتابعة كـ مريض',
    continueAsStaff: 'المتابعة كـ كادر طبي',
    findHospitals: 'استكشاف المستشفيات',
    trackQueue: 'تتبع الدور المباشر',
    emergencyCare: 'طوارئ على مدار الساعة',
    insuranceSupported: 'تأمين معتمد بدون دفع نقدي',
    bookAppointment: 'حجز موعد طبي',
    bedsAvailable: 'الأسرة المتاحة',
    callingToken: 'الرقم المنادى حالياً',
    estimatedWait: 'وقت الانتظار المتوقع',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    register: 'إنشاء حساب جديد',
    searchCityOrHospital: 'ابحث عن اسم المستشفى، المدينة أو التخصص...',
    selectLanguage: 'اللغة',
    patientPortal: 'بوابة المريض',
    staffPortal: 'بوابة الكادر الطبي',
    multilingualAssistant: 'مساعد المرضى متعدد اللغات',
    assistantPrompt: 'هل تحتاج إلى إرشادات بلغتك؟ استكشف تعليمات الطابور والتوجيه الطبي.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
