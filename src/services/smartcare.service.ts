import { db } from '../db/index.ts';
import { hospitals, departments } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export interface SmartCareTriageInput {
  symptoms: string[];
  description?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  durationDays: number;
  painScale: number; // 1 to 10
  age?: number;
  preExistingConditions?: string[];
}

export interface SmartCareTriageResult {
  category: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
  urgencyTitle: string;
  recommendedDepartment: string;
  explanation: string;
  redFlags: string[];
  immediateSteps: string[];
  recommendedHospitals: Array<{
    id: number;
    name: string;
    city: string;
    phone: string;
    emergencyAvailable: boolean;
    availableBeds: number;
    rating: string;
  }>;
}

export class SmartCareService {
  static async triage(input: SmartCareTriageInput): Promise<SmartCareTriageResult> {
    const text = (
      input.symptoms.join(' ') +
      ' ' +
      (input.description || '')
    ).toLowerCase();

    // 1. Check for Emergency Triggers
    const emergencyKeywords = [
      'chest pain',
      'heart attack',
      'shortness of breath',
      'difficulty breathing',
      'stroke',
      'numbness in face',
      'slurred speech',
      'unconscious',
      'heavy bleeding',
      'severe head injury',
      'seizure',
      'anaphylaxis',
      'coughing blood',
    ];

    const isEmergency =
      input.severity === 'SEVERE' ||
      input.painScale >= 8 ||
      emergencyKeywords.some((kw) => text.includes(kw));

    // 2. Department Mapping
    let recommendedDept = 'General Medicine';
    if (text.includes('chest') || text.includes('heart') || text.includes('palpitation')) {
      recommendedDept = 'Cardiology';
    } else if (text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('sprain') || text.includes('back pain')) {
      recommendedDept = 'Orthopedics';
    } else if (text.includes('child') || text.includes('pediatric') || (input.age && input.age < 16)) {
      recommendedDept = 'Pediatrics';
    } else if (text.includes('headache') || text.includes('migraine') || text.includes('dizzy') || text.includes('nerve')) {
      recommendedDept = 'Neurology';
    } else if (text.includes('skin') || text.includes('rash') || text.includes('itching') || text.includes('allergy')) {
      recommendedDept = 'Dermatology';
    } else if (text.includes('cough') || text.includes('lung') || text.includes('asthma') || text.includes('wheezing')) {
      recommendedDept = 'Pulmonology';
    } else if (text.includes('stomach') || text.includes('nausea') || text.includes('vomit') || text.includes('diarrhea')) {
      recommendedDept = 'Gastroenterology';
    }

    if (isEmergency) {
      recommendedDept = 'Emergency & Trauma';
    }

    // 3. Category & Guidance
    let category: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE' = 'ROUTINE';
    let urgencyTitle = 'Scheduled Clinical Consultation';
    let explanation = `Based on your reported symptoms (${input.symptoms.join(', ')}), an outpatient consultation with ${recommendedDept} is recommended for evaluation.`;
    const redFlags: string[] = [];
    const immediateSteps: string[] = [];

    if (isEmergency) {
      category = 'EMERGENCY';
      urgencyTitle = 'Immediate Emergency Attention Required';
      explanation =
        'Your reported symptoms indicate high clinical urgency. Please seek emergency medical care immediately at the nearest Level-1 trauma center or call 911.';
      redFlags.push(
        'Sudden crushing chest pressure or pain radiating to jaw or left arm',
        'Severe shortness of breath or inability to speak full sentences',
        'Sudden onset weakness, facial droop, or confusion',
        'Severe intractable pain score greater than 8/10'
      );
      immediateSteps.push(
        'Call emergency dispatch (911) or proceed directly to hospital emergency room',
        'Do not drive yourself; have a companion or ambulance transport you',
        'Loosen restrictive clothing and sit in a comfortable upright position',
        'Keep your identification, emergency contact, and insurance info ready'
      );
    } else if (input.severity === 'MODERATE' || input.painScale >= 5 || input.durationDays > 3) {
      category = 'URGENT';
      urgencyTitle = 'Same-Day Urgent Care Consultation Recommended';
      explanation = `Your symptoms have persisted for ${input.durationDays} day(s) with moderate discomfort. A same-day walk-in or booked appointment with ${recommendedDept} is strongly recommended to prevent complication.`;
      redFlags.push(
        'Fever exceeding 103°F (39.4°C) that does not respond to antipyretics',
        'Inability to retain liquids for more than 12 hours',
        'Progressive spreading redness, swelling, or localized heat'
      );
      immediateSteps.push(
        'Book the earliest available appointment slot at an affiliated hospital',
        'Stay adequately hydrated and record your temperature every 4 hours',
        'Avoid self-medicating with strong analgesics before a physician evaluation'
      );
    } else if (input.durationDays <= 1 && input.painScale <= 2) {
      category = 'SELF_CARE';
      urgencyTitle = 'Supportive Home Monitoring & Telehealth';
      explanation =
        'Your initial symptoms appear mild. You may monitor your health at home with supportive hydration and rest, or schedule a routine consultation if symptoms do not improve within 48 hours.';
      redFlags.push('Symptoms worsening after 48 hours', 'Development of high fever or acute pain');
      immediateSteps.push(
        'Ensure restful sleep and fluid intake',
        'Monitor your vitals if you have a home monitor (blood pressure, temperature)',
        'Schedule a routine check if not resolved in 2-3 days'
      );
    } else {
      category = 'ROUTINE';
      urgencyTitle = 'Standard Specialist Appointment';
      explanation = `A routine clinical consultation with a ${recommendedDept} specialist is recommended to review your medical history and perform targeted diagnostics.`;
      redFlags.push('Sudden worsening of symptoms', 'New onset pain greater than 5/10');
      immediateSteps.push(
        'Select a doctor in the hospital directory and book an appointment slot',
        'Prepare a summary of your symptom timeline and list of current medications'
      );
    }

    // 4. Fetch matching network hospitals from PostgreSQL
    const allHospitals = await db
      .select({
        id: hospitals.id,
        name: hospitals.name,
        city: hospitals.city,
        phone: hospitals.phone,
        emergencyAvailable: hospitals.emergencyAvailable,
        availableBeds: hospitals.availableBeds,
        rating: hospitals.rating,
      })
      .from(hospitals)
      .where(eq(hospitals.status, 'ACTIVE'))
      .limit(4);

    return {
      category,
      urgencyTitle,
      recommendedDepartment: recommendedDept,
      explanation,
      redFlags,
      immediateSteps,
      recommendedHospitals: allHospitals,
    };
  }
}
