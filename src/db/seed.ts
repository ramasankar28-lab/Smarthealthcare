import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import {
  users,
  hospitals,
  departments,
  doctorProfiles,
  nurseProfiles,
  receptionistProfiles,
  billingProfiles,
  patientProfiles,
  appointmentSlots,
  appointments,
  queues,
  queueEvents,
  bills,
  billItems,
  payments,
  insuranceProviders,
  hospitalInsurances,
  patientInsurances,
  hospitalUpdates,
  platformExpenses,
  hospitalExpenses,
  vitals,
  consultations,
  prescriptions,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingAdmin) {
      console.log('Database already initialized with default seeds.');
      return;
    }

    console.log('Seeding Smart Healthcare database with multi-hospital records...');

    // 1. Central Admin
    const adminPassHash = await bcrypt.hash('Admin@12345', 10);
    await db.insert(users).values({
      uid: 'admin_central_root',
      username: 'admin',
      email: 'centraladmin@smarthealth.net',
      passwordHash: adminPassHash,
      role: 'CENTRAL_ADMIN',
      fullName: 'Chief Platform Administrator',
      phone: '+1 (800) 555-0100',
      isEmailVerified: true,
      status: 'ACTIVE',
    });

    // 2. Insurance Providers
    const [bcbs] = await db
      .insert(insuranceProviders)
      .values({
        name: 'BlueCross BlueShield Care',
        code: 'BCBS',
        coverageType: 'Comprehensive Health & Inpatient',
        supportContact: '1-800-555-BCBS',
        isActive: true,
      })
      .returning();

    const [aetna] = await db
      .insert(insuranceProviders)
      .values({
        name: 'Aetna Global Medical',
        code: 'AETNA',
        coverageType: 'Standard & Specialty Network',
        supportContact: '1-800-555-AETN',
        isActive: true,
      })
      .returning();

    const [uhc] = await db
      .insert(insuranceProviders)
      .values({
        name: 'UnitedHealthcare Premier',
        code: 'UHC',
        coverageType: 'Cashless Network & Critical Illness',
        supportContact: '1-800-555-UHC0',
        isActive: true,
      })
      .returning();

    const [medishield] = await db
      .insert(insuranceProviders)
      .values({
        name: 'MediShield National Health',
        code: 'MEDISHIELD',
        coverageType: 'Essential Universal Shield',
        supportContact: '1-800-555-MEDI',
        isActive: true,
      })
      .returning();

    // 3. Hospitals
    const [metroHospital] = await db
      .insert(hospitals)
      .values({
        code: 'H001',
        name: 'Metro General Hospital & Trauma Center',
        city: 'New York',
        address: '100 Medical Center Blvd, Downtown Manhattan',
        phone: '+1 (555) 234-5678',
        email: 'contact@metrogeneral.org',
        totalBeds: 250,
        availableBeds: 48,
        emergencyAvailable: true,
        rating: '4.9',
        description: 'Level-1 trauma center and premier multi-specialty healthcare pavilion.',
      })
      .returning();

    const [stJudeHospital] = await db
      .insert(hospitals)
      .values({
        code: 'H002',
        name: 'St. Jude Medical Research Hospital',
        city: 'Boston',
        address: '45 Hope Way, Longwood Medical Area',
        phone: '+1 (555) 876-5432',
        email: 'info@stjudemedical.org',
        totalBeds: 180,
        availableBeds: 32,
        emergencyAvailable: true,
        rating: '4.8',
        description: 'Renowned academic hospital leading pediatric care, neurology, and diagnostics.',
      })
      .returning();

    const [apexHospital] = await db
      .insert(hospitals)
      .values({
        code: 'H003',
        name: 'Apex Specialty & Cardiology Institute',
        city: 'Chicago',
        address: '720 Lakeview Medical Plaza, Michigan Ave',
        phone: '+1 (555) 432-1098',
        email: 'care@apexspecialty.org',
        totalBeds: 140,
        availableBeds: 22,
        emergencyAvailable: true,
        rating: '4.7',
        description: 'Advanced cardiovascular care and modern outpatient surgical facilities.',
      })
      .returning();

    // 4. Link Insurances to Hospitals
    await db.insert(hospitalInsurances).values([
      { hospitalId: metroHospital.id, providerId: bcbs.id, isCashlessSupported: true, copayPercentage: 10 },
      { hospitalId: metroHospital.id, providerId: aetna.id, isCashlessSupported: true, copayPercentage: 15 },
      { hospitalId: metroHospital.id, providerId: uhc.id, isCashlessSupported: true, copayPercentage: 10 },
      { hospitalId: stJudeHospital.id, providerId: bcbs.id, isCashlessSupported: true, copayPercentage: 10 },
      { hospitalId: stJudeHospital.id, providerId: medishield.id, isCashlessSupported: true, copayPercentage: 5 },
      { hospitalId: apexHospital.id, providerId: aetna.id, isCashlessSupported: true, copayPercentage: 15 },
      { hospitalId: apexHospital.id, providerId: uhc.id, isCashlessSupported: true, copayPercentage: 10 },
    ]);

    // 5. Hospital Admins
    const metroAdminPass = await bcrypt.hash('MetroAdmin@123', 10);
    await db.insert(users).values({
      uid: 'h_admin_h001',
      username: 'admin_h001',
      email: 'admin.h001@metrogeneral.org',
      passwordHash: metroAdminPass,
      role: 'HOSPITAL_ADMIN',
      hospitalId: metroHospital.id,
      fullName: 'Metro Hospital Director H001',
      phone: '+1 (555) 234-9901',
      isEmailVerified: true,
      status: 'ACTIVE',
    });

    const judeAdminPass = await bcrypt.hash('JudeAdmin@123', 10);
    await db.insert(users).values({
      uid: 'h_admin_h002',
      username: 'admin_h002',
      email: 'admin.h002@stjudemedical.org',
      passwordHash: judeAdminPass,
      role: 'HOSPITAL_ADMIN',
      hospitalId: stJudeHospital.id,
      fullName: 'St. Jude Hospital Admin H002',
      phone: '+1 (555) 876-9902',
      isEmailVerified: true,
      status: 'ACTIVE',
    });

    const apexAdminPass = await bcrypt.hash('ApexAdmin@123', 10);
    await db.insert(users).values({
      uid: 'h_admin_h003',
      username: 'admin_h003',
      email: 'admin.h003@apexspecialty.org',
      passwordHash: apexAdminPass,
      role: 'HOSPITAL_ADMIN',
      hospitalId: apexHospital.id,
      fullName: 'Apex Specialty Admin H003',
      phone: '+1 (555) 432-9903',
      isEmailVerified: true,
      status: 'ACTIVE',
    });

    // 6. Departments in Metro Hospital
    const [cardioDept] = await db
      .insert(departments)
      .values({
        hospitalId: metroHospital.id,
        name: 'Cardiology & Vascular',
        description: 'Comprehensive heart care, catheterization, and post-cardiac recovery.',
        headDoctorName: 'Dr. Sarah Jenkins',
      })
      .returning();

    const [pedsDept] = await db
      .insert(departments)
      .values({
        hospitalId: metroHospital.id,
        name: 'Pediatrics & Neonatology',
        description: 'Child health, immunization, growth tracking, and pediatric emergency.',
        headDoctorName: 'Dr. Robert Chen',
      })
      .returning();

    const [orthoDept] = await db
      .insert(departments)
      .values({
        hospitalId: metroHospital.id,
        name: 'Orthopedics & Sports Medicine',
        description: 'Joint replacement, trauma surgery, and spine therapy.',
        headDoctorName: 'Dr. Marcus Vance',
      })
      .returning();

    // Departments in St. Jude
    const [neuroDept] = await db
      .insert(departments)
      .values({
        hospitalId: stJudeHospital.id,
        name: 'Neurology & Stroke Center',
        description: 'Brain, spine, and neuro-rehabilitation facilities.',
        headDoctorName: 'Dr. Emily Davis',
      })
      .returning();

    // 7. Metro Staff (Doctors, Nurses, Receptionist, Billing)
    const staffPass = await bcrypt.hash('Doctor@123', 10);
    const nursePass = await bcrypt.hash('Nurse@123', 10);
    const recPass = await bcrypt.hash('Reception@123', 10);
    const billPass = await bcrypt.hash('Billing@123', 10);

    // Dr. Sarah Jenkins (Cardiology)
    const [userJenkins] = await db
      .insert(users)
      .values({
        uid: 'dr_jenkins_uid',
        username: 'dr_jenkins',
        email: 'sjenkins@metrogeneral.org',
        passwordHash: staffPass,
        role: 'DOCTOR',
        hospitalId: metroHospital.id,
        fullName: 'Dr. Sarah Jenkins, MD',
        phone: '+1 (555) 234-7001',
        isEmailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      })
      .returning();

    const [docJenkins] = await db
      .insert(doctorProfiles)
      .values({
        userId: userJenkins.id,
        hospitalId: metroHospital.id,
        departmentId: cardioDept.id,
        specialty: 'Interventional Cardiology',
        qualification: 'MD, FACC - Harvard Medical School',
        experienceYears: 14,
        consultationFee: 75,
        roomNumber: 'Room 204',
        bio: 'Specialist in preventative cardiology, coronary interventions, and arrhythmias.',
        isAvailable: true,
      })
      .returning();

    // Dr. Robert Chen (Pediatrics)
    const [userChen] = await db
      .insert(users)
      .values({
        uid: 'dr_chen_uid',
        username: 'dr_chen',
        email: 'rchen@metrogeneral.org',
        passwordHash: staffPass,
        role: 'DOCTOR',
        hospitalId: metroHospital.id,
        fullName: 'Dr. Robert Chen, MD',
        phone: '+1 (555) 234-7002',
        isEmailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      })
      .returning();

    const [docChen] = await db
      .insert(doctorProfiles)
      .values({
        userId: userChen.id,
        hospitalId: metroHospital.id,
        departmentId: pedsDept.id,
        specialty: 'General & Preventive Pediatrics',
        qualification: 'MD, FAAP - Johns Hopkins University',
        experienceYears: 11,
        consultationFee: 60,
        roomNumber: 'Room 108',
        bio: 'Dedicated to compassionate pediatric care, adolescent wellness, and nutrition.',
        isAvailable: true,
      })
      .returning();

    // Dr. Emily Davis (St. Jude Neurology)
    const [userDavis] = await db
      .insert(users)
      .values({
        uid: 'dr_davis_uid',
        username: 'dr_davis',
        email: 'edavis@stjudemedical.org',
        passwordHash: staffPass,
        role: 'DOCTOR',
        hospitalId: stJudeHospital.id,
        fullName: 'Dr. Emily Davis, MD',
        phone: '+1 (555) 876-7001',
        isEmailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(doctorProfiles).values({
      userId: userDavis.id,
      hospitalId: stJudeHospital.id,
      departmentId: neuroDept.id,
      specialty: 'Neurology & Movement Disorders',
      qualification: 'MD, PhD - Columbia University',
      experienceYears: 16,
      consultationFee: 90,
      roomNumber: 'Room 312',
      bio: 'Leading research on neurodegenerative conditions and acute stroke response.',
      isAvailable: true,
    });

    // Nurse Elena Rostova
    const [userNurse] = await db
      .insert(users)
      .values({
        uid: 'nurse_elena_uid',
        username: 'nurse_elena',
        email: 'elena.r@metrogeneral.org',
        passwordHash: nursePass,
        role: 'NURSE',
        hospitalId: metroHospital.id,
        fullName: 'Nurse Elena Rostova, BSN',
        phone: '+1 (555) 234-8001',
        isEmailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(nurseProfiles).values({
      userId: userNurse.id,
      hospitalId: metroHospital.id,
      departmentId: cardioDept.id,
      shift: 'MORNING',
      station: 'Triage Station 2',
    });

    // Receptionist Lisa Gomez
    const [userRec] = await db
      .insert(users)
      .values({
        uid: 'rec_lisa_uid',
        username: 'rec_lisa',
        email: 'lisa.gomez@metrogeneral.org',
        passwordHash: recPass,
        role: 'RECEPTIONIST',
        hospitalId: metroHospital.id,
        fullName: 'Receptionist Lisa Gomez',
        phone: '+1 (555) 234-8002',
        isEmailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(receptionistProfiles).values({
      userId: userRec.id,
      hospitalId: metroHospital.id,
      deskNumber: 'Central Outpatient Desk 1',
    });

    // Billing Officer Mark Stevens
    const [userBill] = await db
      .insert(users)
      .values({
        uid: 'bill_mark_uid',
        username: 'bill_mark',
        email: 'mark.stevens@metrogeneral.org',
        passwordHash: billPass,
        role: 'BILLING',
        hospitalId: metroHospital.id,
        fullName: 'Billing Officer Mark Stevens',
        phone: '+1 (555) 234-8003',
        isEmailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(billingProfiles).values({
      userId: userBill.id,
      hospitalId: metroHospital.id,
      counterNumber: 'Cash & Insurance Counter B1',
    });

    // 8. Demo Patient: Johnathan Doe
    const patientPass = await bcrypt.hash('Patient@123', 10);
    const [patientUser] = await db
      .insert(users)
      .values({
        uid: 'patient_john_uid',
        username: 'patient_john',
        email: 'john.doe@example.com',
        passwordHash: patientPass,
        role: 'PATIENT',
        fullName: 'Johnathan Doe',
        phone: '+1 (555) 901-2345',
        isEmailVerified: true,
        status: 'ACTIVE',
      })
      .returning();

    const [patientProfile] = await db
      .insert(patientProfiles)
      .values({
        userId: patientUser.id,
        dob: '1988-06-14',
        gender: 'MALE',
        address: '42 Elm Street, New York, NY 10001',
        bloodGroup: 'O+',
        emergencyContact: 'Sarah Doe (+1 555-901-9988)',
        allergies: 'Penicillin',
      })
      .returning();

    // Patient Insurance
    await db.insert(patientInsurances).values({
      patientId: patientProfile.id,
      providerId: bcbs.id,
      policyNumber: 'BCBS-NY-9920148',
      validUntil: '2028-12-31',
      coverageAmount: 50000,
      status: 'VERIFIED',
    });

    // 9. Appointment Slots for Today & Tomorrow
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const [slot1] = await db
      .insert(appointmentSlots)
      .values({
        hospitalId: metroHospital.id,
        doctorId: docJenkins.id,
        date: today,
        startTime: '09:00',
        endTime: '09:30',
        maxPatients: 1,
        bookedCount: 1,
        status: 'FULL',
      })
      .returning();

    await db.insert(appointmentSlots).values([
      { hospitalId: metroHospital.id, doctorId: docJenkins.id, date: today, startTime: '09:30', endTime: '10:00', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
      { hospitalId: metroHospital.id, doctorId: docJenkins.id, date: today, startTime: '10:00', endTime: '10:30', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
      { hospitalId: metroHospital.id, doctorId: docJenkins.id, date: today, startTime: '10:30', endTime: '11:00', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
      { hospitalId: metroHospital.id, doctorId: docJenkins.id, date: tomorrow, startTime: '09:00', endTime: '09:30', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
      { hospitalId: metroHospital.id, doctorId: docJenkins.id, date: tomorrow, startTime: '10:00', endTime: '10:30', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
      { hospitalId: metroHospital.id, doctorId: docChen.id, date: today, startTime: '11:00', endTime: '11:30', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
      { hospitalId: metroHospital.id, doctorId: docChen.id, date: today, startTime: '11:30', endTime: '12:00', maxPatients: 1, bookedCount: 0, status: 'AVAILABLE' },
    ]);

    // 10. Sample Active Appointment for Johnathan Doe with Dr. Jenkins
    const [demoApt] = await db
      .insert(appointments)
      .values({
        bookingReference: 'APT-2026-METRO-01',
        hospitalId: metroHospital.id,
        patientId: patientProfile.id,
        doctorId: docJenkins.id,
        departmentId: cardioDept.id,
        slotId: slot1.id,
        appointmentDate: today,
        appointmentTime: '09:00',
        reason: 'Routine Cardiology Follow-up & Blood Pressure Check',
        status: 'CHECKED_IN',
        notes: 'Patient reports occasional mild palpitations after cardio exercise.',
      })
      .returning();

    // Queue for today
    const [queueMetroCardio] = await db
      .insert(queues)
      .values({
        hospitalId: metroHospital.id,
        departmentId: cardioDept.id,
        doctorId: docJenkins.id,
        date: today,
        currentCallingToken: 1,
        totalTokens: 3,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(queueEvents).values([
      { queueId: queueMetroCardio.id, appointmentId: demoApt.id, patientId: patientProfile.id, tokenNumber: 1, status: 'CALLED', estimatedWaitMinutes: 0 },
      { queueId: queueMetroCardio.id, appointmentId: null, patientId: patientProfile.id, tokenNumber: 2, status: 'WAITING', estimatedWaitMinutes: 15 },
      { queueId: queueMetroCardio.id, appointmentId: null, patientId: patientProfile.id, tokenNumber: 3, status: 'WAITING', estimatedWaitMinutes: 30 },
    ]);

    // Sample Bill for Johnathan Doe
    const [demoBill] = await db
      .insert(bills)
      .values({
        billNumber: 'INV-2026-90412',
        hospitalId: metroHospital.id,
        patientId: patientProfile.id,
        appointmentId: demoApt.id,
        totalAmount: 180,
        insuranceDiscount: 150,
        netPayable: 30,
        paidAmount: 30,
        status: 'PAID',
        dueDate: today,
      })
      .returning();

    await db.insert(billItems).values([
      { billId: demoBill.id, description: 'Cardiology Specialist Consultation', unitPrice: 75, quantity: 1, totalPrice: 75 },
      { billId: demoBill.id, description: '12-Lead Electrocardiogram (ECG)', unitPrice: 105, quantity: 1, totalPrice: 105 },
    ]);

    await db.insert(payments).values({
      transactionId: 'TXN-2026-884192',
      billId: demoBill.id,
      hospitalId: metroHospital.id,
      patientId: patientProfile.id,
      amount: 30,
      paymentMethod: 'UPI',
      status: 'SUCCESS',
    });

    // Sample Vitals for Patient
    await db.insert(vitals).values({
      hospitalId: metroHospital.id,
      patientId: patientProfile.id,
      bloodPressure: '122/78 mmHg',
      heartRate: 72,
      temperature: '98.4 F',
      respiratoryRate: 16,
      oxygenSaturation: 99,
      weightKg: '74 kg',
    });

    // Sample Consultation & Prescriptions
    const [demoConsult] = await db
      .insert(consultations)
      .values({
        appointmentId: demoApt.id,
        hospitalId: metroHospital.id,
        doctorId: docJenkins.id,
        patientId: patientProfile.id,
        chiefComplaint: 'Intermittent chest flutter during exertion',
        diagnosis: 'Mild Sinus Arrhythmia, Normal Left Ventricular Function',
        clinicalNotes: 'ECG shows normal rhythm without ST-segment changes. Advised moderate hydration and lifestyle balance.',
        followUpDate: '2026-11-15',
      })
      .returning();

    await db.insert(prescriptions).values([
      { consultationId: demoConsult.id, hospitalId: metroHospital.id, patientId: patientProfile.id, doctorId: docJenkins.id, medicationName: 'Metoprolol Succinate', dosage: '25mg', frequency: 'Once daily in the morning', durationDays: 30, instructions: 'Take with food or glass of water' },
      { consultationId: demoConsult.id, hospitalId: metroHospital.id, patientId: patientProfile.id, doctorId: docJenkins.id, medicationName: 'Omega-3 Marine Lipid Acid', dosage: '1000mg', frequency: 'Once daily after dinner', durationDays: 60, instructions: 'Dietary heart support' },
    ]);

    // Hospital Updates
    await db.insert(hospitalUpdates).values([
      {
        hospitalId: metroHospital.id,
        title: 'New High-Resolution 3T MRI Suite Opened',
        content: 'Metro General has inaugurated its cutting-edge 3T MRI scanner reducing scan durations by 40% with superior cardiac and neuro-imaging clarity.',
        category: 'FACILITY_UPDATE',
        isPublic: true,
      },
      {
        hospitalId: metroHospital.id,
        title: 'Emergency Trauma Ward Expansion Completed',
        content: 'Our Level-1 emergency trauma capacity has expanded by 20 additional monitored acute beds with 24/7 dedicated triage.',
        category: 'ANNOUNCEMENT',
        isPublic: true,
      },
      {
        hospitalId: stJudeHospital.id,
        title: 'Annual Blood Donation & Plasma Drive',
        content: 'Join St. Jude Medical Research Hospital this Saturday for our community blood drive. All blood types are urgently welcomed.',
        category: 'BLOOD_DRIVE',
        isPublic: true,
      },
    ]);

    // Platform Expenses
    await db.insert(platformExpenses).values([
      { category: 'Cloud Infrastructure & High-Availability Database', description: 'Google Cloud SQL Developer Tier & Multi-Region Compute', amount: 850, recordedDate: '2026-09-01', recordedBy: 'Platform Admin' },
      { category: 'Data Security & HIPAA Compliance Auditing', description: 'Third-party encryption verification and vulnerability scan', amount: 1200, recordedDate: '2026-09-10', recordedBy: 'Platform Admin' },
      { category: 'Network Telehealth Gateway Licenses', description: 'Secure video-consultation bandwidth and session relays', amount: 450, recordedDate: '2026-09-20', recordedBy: 'Platform Admin' },
    ]);

    // Hospital Expenses
    await db.insert(hospitalExpenses).values([
      { hospitalId: metroHospital.id, category: 'Medical Supplies & PPE', description: 'Sterile surgical consumables, masks, and gloves bulk replenishment', amount: 4200, expenseDate: '2026-09-15' },
      { hospitalId: metroHospital.id, category: 'Diagnostic Reagents', description: 'Pathology biochemistry and hematology testing cartridges', amount: 2800, expenseDate: '2026-09-22' },
    ]);

    console.log('Database successfully seeded with realistic multi-hospital network data!');
  } catch (err) {
    console.error('Error during database seed:', err);
  }
}
