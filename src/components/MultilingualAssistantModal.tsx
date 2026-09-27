import React, { useState } from 'react';
import { useLanguage, Language } from '../context/LanguageContext.tsx';
import {
  Globe,
  FileText,
  CreditCard,
  Clock,
  HeartPulse,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const MultilingualAssistantModal: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'queue' | 'insurance' | 'emergency' | 'billing'>('queue');

  const content: Record<
    Language,
    {
      queueTitle: string;
      queueDesc: string[];
      insuranceTitle: string;
      insuranceDesc: string[];
      emergencyTitle: string;
      emergencyDesc: string[];
      billingTitle: string;
      billingDesc: string[];
    }
  > = {
    en: {
      queueTitle: 'How Digital Queue Tracking Works',
      queueDesc: [
        'When your appointment is confirmed, you receive an automated Queue Token number.',
        'Track live progress via the website or mobile portal to see which patient token is currently in consultation.',
        'Arrive at the department waiting area 10 minutes before your estimated time.',
        'When your token appears on screen or status changes to "CALLED", proceed directly to the designated room.',
      ],
      insuranceTitle: 'Cashless Insurance Verification Guide',
      insuranceDesc: [
        'Link your policy number in the Patient Portal under "My Insurances".',
        'Verify if your chosen hospital supports Cashless Admissions for your provider.',
        'Approved policies automatically receive hospital copay discount calculations on medical bills.',
        'Bring your physical or digital insurance card and photo ID for final hospital billing counter settlement.',
      ],
      emergencyTitle: '24/7 Emergency & Acute Trauma Protocols',
      emergencyDesc: [
        'Hospitals marked with "24/7 ER Ready" maintain continuous trauma surgeons and acute resuscitation units.',
        'Emergency patients do not require pre-scheduled tokens; proceed immediately to the Emergency Triage desk.',
        'Live bed monitors reflect acute and ICU bed capacity updated directly by hospital administrative staff.',
      ],
      billingTitle: 'Transparent Invoices & Flexible Payments',
      billingDesc: [
        'All consultation and procedure fees are itemized with clear unit costs.',
        'Payments can be completed securely using Credit/Debit Card, UPI, Net Banking, or Hospital Cash Counters.',
        'Digital payment receipts and transaction identifiers are generated immediately for claims or tax reimbursement.',
      ],
    },
    es: {
      queueTitle: 'Cómo Funciona el Seguimiento de Colas',
      queueDesc: [
        'Al confirmar su cita, recibirá un número de turno automatizado.',
        'Consulte el estado en vivo en el portal para ver qué turno está en consulta.',
        'Llegue a la sala de espera 10 minutos antes de la hora estimada.',
        'Cuando su turno aparezca en pantalla o cambie a "LLAMADO", acérquese a la sala indicada.',
      ],
      insuranceTitle: 'Guía de Cobertura de Seguros',
      insuranceDesc: [
        'Registre su póliza en el portal de pacientes en "Mis Seguros".',
        'Compruebe si el hospital admite liquidación directa para su aseguradora.',
        'Las facturas reflejarán automáticamente el porcentaje de copago cubierto.',
        'Presente su identificación y carné de seguro en la ventanilla de facturación.',
      ],
      emergencyTitle: 'Atención de Urgencias y Traumatología 24/7',
      emergencyDesc: [
        'Los centros con el distintivo "24/7 ER Ready" cuentan con guardia médica ininterrumpida.',
        'Los casos urgentes no requieren turno previo: diríjase al triaje de urgencias.',
        'La disponibilidad de camas de cuidados intensivos se actualiza en tiempo real.',
      ],
      billingTitle: 'Facturación Transparente y Formas de Pago',
      billingDesc: [
        'Cada consulta y estudio se detalla con precios claros y conceptos unitarios.',
        'Puede abonar de forma segura con tarjeta, banca electrónica o en caja.',
        'Se expiden recibos digitales válidos para reintegros o declaraciones tributarias.',
      ],
    },
    fr: {
      queueTitle: 'Fonctionnement de la File Virtuelle',
      queueDesc: [
        'Dès la confirmation du rendez-vous, un ticket numéroté vous est attribué.',
        'Suivez en temps réel le numéro en cours de consultation sur la plateforme.',
        'Présentez-vous en salle d’attente 10 minutes avant l’horaire estimé.',
        'Dès que votre ticket est appelé, rendez-vous dans le cabinet médical désigné.',
      ],
      insuranceTitle: 'Guide de Prise en Charge Assurance',
      insuranceDesc: [
        'Associez votre police d’assurance dans votre espace patient.',
        'Vérifiez les accords de tiers payant avec l’hôpital choisi.',
        'Les factures calculent automatiquement la part prise en charge et le ticket modérateur.',
        'Présentez votre carte d’assurance et pièce d’identité au bureau de facturation.',
      ],
      emergencyTitle: 'Service des Urgences 24/7',
      emergencyDesc: [
        'Les hôpitaux labellisés "24/7 ER Ready" disposent d’une équipe médicale permanente.',
        'En cas d’urgence vitale, présentez-vous sans rendez-vous au guichet de triage.',
        'Le nombre de lits disponibles en soins intensifs est actualisé en continu.',
      ],
      billingTitle: 'Facturation et Règlements Sécurisés',
      billingDesc: [
        'Chaque acte médical est ventilé avec clarté et transparence tarifaire.',
        'Règlement possible par carte bancaire, virement ou au guichet hospitalier.',
        'Téléchargement immédiat de vos attestations et reçus de paiement.',
      ],
    },
    hi: {
      queueTitle: 'डिजिटल कतार ट्रैकिंग कैसे काम करती है',
      queueDesc: [
        'अपॉइंटमेंट की पुष्टि होने पर आपको एक डिजिटल टोकन नंबर दिया जाता है।',
        'वेबसाइट पर लाइव देखें कि वर्तमान में कौन सा टोकन डॉक्टर के पास है।',
        'अपने अनुमानित समय से 10 मिनट पहले अस्पताल के प्रतीक्षालय में पहुंचें।',
        'जब आपका टोकन स्क्रीन पर दिखे, तो सीधे परामर्श कक्ष में प्रवेश करें।',
      ],
      insuranceTitle: 'कैशलेस बीमा सत्यापन सहायता',
      insuranceDesc: [
        'पेशेंट पोर्टल में "My Insurances" के तहत अपनी पॉलिसी विवरण जोड़ें।',
        'जांचें कि चयनित अस्पताल में आपकी बीमा कंपनी से कैशलेस सुविधा उपलब्ध है या नहीं।',
        'मान्य पॉलिसी होने पर बिल में बीमा छूट सीधे घटा दी जाएगी।',
        'अंतिम पुष्टि के लिए अपना बीमा कार्ड और पहचान पत्र अस्पताल बिलिंग काउंटर पर दिखाएं।',
      ],
      emergencyTitle: '24/7 आपातकालीन और ट्रॉमा सेवा',
      emergencyDesc: [
        '"24/7 ER Ready" चिह्नित अस्पताल हर समय आपातकालीन डॉक्टरों और वेंटिलेटर से सुसज्जित हैं।',
        'आपातकालीन स्थिति में पहले से टोकन की आवश्यकता नहीं होती; सीधे ट्रॉमा ट्रायज में जाएं।',
        'उपलब्ध आईसीयू और सामान्य बिस्तरों की संख्या अस्पताल द्वारा लाइव अपडेट की जाती है।',
      ],
      billingTitle: 'पारदर्शी बिलिंग और भुगतान',
      billingDesc: [
        'परामर्श, परीक्षण और दवाओं की दरें स्पष्ट रूप से बिल में सूचीबद्ध होती हैं।',
        'आप यूपीआई, कार्ड, नेट बैंकिंग या कैश काउंटर के माध्यम से भुगतान कर सकते हैं।',
        'भुगतान रसीद तुरंत डाउनलोड की जा सकती है।',
      ],
    },
    ar: {
      queueTitle: 'كيف يعمل نظام تتبع الطابور الرقمي',
      queueDesc: [
        'عند تأكيد الحجز، يتم إصدار رقم دور رقمي (Token) خاص بك تلقائياً.',
        'يمكنك متابعة الدور الجاري في عيادة الطبيب مباشرة عبر الموقع أو الهاتف.',
        'يرجى الحضور إلى صالة الانتظار قبل موعدك التقديري بـ 10 دقائق.',
        'عند ظهور رقمك أو تغير حالته إلى "تم الاستدعاء"، توجه مباشرة إلى الغرفة المحددة.',
      ],
      insuranceTitle: 'دليل التأمين الطبي والخصم المباشر',
      insuranceDesc: [
        'أضف بيانات وثيقة التأمين الخاصة بك في بوابة المريض.',
        'تحقق من المستشفيات المعتمدة لشبكة التأمين الطبي الخاصة بك.',
        'يتم احتساب نسبة التغطية والتحمل مباشرة على الفاتورة الطبية.',
        'يرجى إبراز بطاقة التأمين والهوية الشخصية في مكتب المحاسبة بالمستشفى.',
      ],
      emergencyTitle: 'خدمات الطوارئ والرعاية الحرجة 24/7',
      emergencyDesc: [
        'المستشفيات المميزة بـ "24/7 ER Ready" مجهزة بأقسام طوارئ وجراحة على مدار الساعة.',
        'الحالات الطارئة لا تتطلب حجزاً مسبقاً، يرجى التوجه فوراً إلى مكتب الفرز الأولي.',
        'يتم تحديث عدد الأسرة الشاغرة والعناية المركزة بشكل دوري من قبل إدارة المستشفى.',
      ],
      billingTitle: 'فواتير واضحة وطرق دفع متعددة',
      billingDesc: [
        'تفاصيل كاملة لكل فحص أو استشارة طبية مع توضيح الرسوم بدقة.',
        'يمكن الدفع إلكترونياً بالبطاقة الائتمانية أو الحساب البنكي أو نقداً بالمستشفى.',
        'يتم استخراج إيصالات دفع إلكترونية معتمدة فور إتمام المعاملة.',
      ],
    },
  };

  const curr = content[language] || content.en;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">{t.multilingualAssistant}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.assistantPrompt}</p>
        </div>

        {/* Quick Language Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['en', 'es', 'fr', 'hi', 'ar'] as Language[]).map((lng) => (
            <button
              key={lng}
              onClick={() => setLanguage(lng)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                language === lng
                  ? 'bg-white text-cyan-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'queue'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Queue System</span>
        </button>

        <button
          onClick={() => setActiveTab('insurance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'insurance'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Insurance Coverage</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'emergency'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Emergency 24/7</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'billing'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing & Payments</span>
        </button>
      </div>

      {/* Tab Content Box */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
        {activeTab === 'queue' && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              {curr.queueTitle}
            </h3>
            <ul className="space-y-2.5">
              {curr.queueDesc.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'insurance' && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {curr.insuranceTitle}
            </h3>
            <ul className="space-y-2.5">
              {curr.insuranceDesc.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              {curr.emergencyTitle}
            </h3>
            <ul className="space-y-2.5">
              {curr.emergencyDesc.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'billing' && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              {curr.billingTitle}
            </h3>
            <ul className="space-y-2.5">
              {curr.billingDesc.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
