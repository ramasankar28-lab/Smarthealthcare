import { db } from '../db/index.ts';
import {
  patientProfiles,
  vitals,
  consultations,
  prescriptions,
  medicalRecords,
  reviews,
  users,
  doctorProfiles,
  hospitals,
  nurseProfiles,
  auditLogs,
} from '../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';

export class PatientService {
  static async getPatientProfile(patientUserId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, patientUserId)).limit(1);
    if (!user) throw new Error('User not found.');

    const [profile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientUserId))
      .limit(1);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        username: user.username,
      },
      profile,
    };
  }

  static async updatePatientProfile(patientUserId: number, data: {
    fullName?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
    allergies?: string;
  }) {
    if (data.fullName || data.phone) {
      await db
        .update(users)
        .set({
          ...(data.fullName ? { fullName: data.fullName } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, patientUserId));
    }

    const [updated] = await db
      .update(patientProfiles)
      .set({
        ...(data.dob ? { dob: data.dob } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.bloodGroup ? { bloodGroup: data.bloodGroup } : {}),
        ...(data.emergencyContact ? { emergencyContact: data.emergencyContact } : {}),
        ...(data.allergies ? { allergies: data.allergies } : {}),
      })
      .where(eq(patientProfiles.userId, patientUserId))
      .returning();

    return updated;
  }

  static async recordVitals(data: {
    hospitalId: number;
    patientId: number;
    nurseUserId: number;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: string;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weightKg?: string;
  }) {
    const [nurse] = await db
      .select()
      .from(nurseProfiles)
      .where(eq(nurseProfiles.userId, data.nurseUserId))
      .limit(1);

    const [vital] = await db
      .insert(vitals)
      .values({
        hospitalId: data.hospitalId,
        patientId: data.patientId,
        recordedByNurseId: nurse?.id || null,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate,
        temperature: data.temperature,
        respiratoryRate: data.respiratoryRate,
        oxygenSaturation: data.oxygenSaturation,
        weightKg: data.weightKg,
      })
      .returning();

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.nurseUserId,
      action: 'RECORD_VITALS',
      resource: 'vitals',
      details: `Vitals recorded for patient #${data.patientId}`,
    });

    return vital;
  }

  static async getPatientVitals(patientId: number) {
    return await db
      .select()
      .from(vitals)
      .where(eq(vitals.patientId, patientId))
      .orderBy(desc(vitals.recordedAt));
  }

  static async recordConsultation(data: {
    appointmentId: number;
    hospitalId: number;
    doctorUserId: number;
    patientId: number;
    chiefComplaint: string;
    diagnosis: string;
    clinicalNotes?: string;
    followUpDate?: string;
    prescriptionsList?: Array<{
      medicationName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }>;
  }) {
    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, data.doctorUserId))
      .limit(1);

    if (!doctor) throw new Error('Doctor profile not found.');

    const [consultation] = await db
      .insert(consultations)
      .values({
        appointmentId: data.appointmentId,
        hospitalId: data.hospitalId,
        doctorId: doctor.id,
        patientId: data.patientId,
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        clinicalNotes: data.clinicalNotes,
        followUpDate: data.followUpDate,
      })
      .returning();

    if (data.prescriptionsList && data.prescriptionsList.length > 0) {
      for (const rx of data.prescriptionsList) {
        await db.insert(prescriptions).values({
          consultationId: consultation.id,
          hospitalId: data.hospitalId,
          patientId: data.patientId,
          doctorId: doctor.id,
          medicationName: rx.medicationName,
          dosage: rx.dosage,
          frequency: rx.frequency,
          durationDays: rx.durationDays,
          instructions: rx.instructions,
        });
      }
    }

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.doctorUserId,
      action: 'RECORD_CONSULTATION',
      resource: 'consultations',
      details: `Consultation logged for patient #${data.patientId}. Diagnosis: ${data.diagnosis}`,
    });

    return consultation;
  }

  static async getPatientConsultations(patientId: number) {
    const list = await db
      .select({
        id: consultations.id,
        appointmentId: consultations.appointmentId,
        chiefComplaint: consultations.chiefComplaint,
        diagnosis: consultations.diagnosis,
        clinicalNotes: consultations.clinicalNotes,
        followUpDate: consultations.followUpDate,
        createdAt: consultations.createdAt,
        hospitalName: hospitals.name,
        doctorName: users.fullName,
        doctorSpecialty: doctorProfiles.specialty,
      })
      .from(consultations)
      .innerJoin(hospitals, eq(consultations.hospitalId, hospitals.id))
      .innerJoin(doctorProfiles, eq(consultations.doctorId, doctorProfiles.id))
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.createdAt));

    const enhanced = await Promise.all(
      list.map(async (c) => {
        const rx = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.consultationId, c.id));
        return {
          ...c,
          prescriptions: rx,
        };
      })
    );

    return enhanced;
  }

  static async addMedicalRecord(data: {
    hospitalId: number;
    patientId: number;
    doctorId?: number;
    recordType: string;
    title: string;
    details?: string;
    fileUrl?: string;
    staffUserId: number;
  }) {
    const [rec] = await db
      .insert(medicalRecords)
      .values({
        hospitalId: data.hospitalId,
        patientId: data.patientId,
        doctorId: data.doctorId || null,
        recordType: data.recordType,
        title: data.title,
        details: data.details,
        fileUrl: data.fileUrl,
      })
      .returning();

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.staffUserId,
      action: 'ADD_MEDICAL_RECORD',
      resource: 'medical_records',
      details: `Uploaded ${data.recordType}: ${data.title}`,
    });

    return rec;
  }

  static async getPatientMedicalRecords(patientId: number) {
    return await db
      .select({
        id: medicalRecords.id,
        recordType: medicalRecords.recordType,
        title: medicalRecords.title,
        details: medicalRecords.details,
        fileUrl: medicalRecords.fileUrl,
        recordedAt: medicalRecords.recordedAt,
        hospitalName: hospitals.name,
      })
      .from(medicalRecords)
      .innerJoin(hospitals, eq(medicalRecords.hospitalId, hospitals.id))
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.recordedAt));
  }

  static async addReview(data: {
    hospitalId: number;
    patientUserId: number;
    doctorId?: number;
    rating: number;
    comment?: string;
  }) {
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, data.patientUserId))
      .limit(1);

    if (!patient) throw new Error('Patient profile not found.');

    const [review] = await db
      .insert(reviews)
      .values({
        hospitalId: data.hospitalId,
        patientId: patient.id,
        doctorId: data.doctorId || null,
        rating: data.rating,
        comment: data.comment,
      })
      .returning();

    return review;
  }

  static async getReviews(hospitalId?: number) {
    const conditions = [];
    if (hospitalId) {
      conditions.push(eq(reviews.hospitalId, hospitalId));
    }

    const list = await db
      .select({
        id: reviews.id,
        hospitalId: reviews.hospitalId,
        hospitalName: hospitals.name,
        patientId: reviews.patientId,
        patientName: users.fullName,
        doctorId: reviews.doctorId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(hospitals, eq(reviews.hospitalId, hospitals.id))
      .innerJoin(patientProfiles, eq(reviews.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt));

    return list;
  }
}
