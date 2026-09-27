import { db } from '../db/index.ts';
import {
  insuranceProviders,
  hospitalInsurances,
  patientInsurances,
  hospitals,
  patientProfiles,
  auditLogs,
} from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export class InsuranceService {
  static async getProviders() {
    return await db.select().from(insuranceProviders).where(eq(insuranceProviders.isActive, true));
  }

  static async createProvider(data: {
    name: string;
    code: string;
    coverageType: string;
    supportContact?: string;
  }, adminUserId: number) {
    const [provider] = await db
      .insert(insuranceProviders)
      .values({
        name: data.name.trim(),
        code: data.code.toUpperCase().trim(),
        coverageType: data.coverageType,
        supportContact: data.supportContact,
        isActive: true,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: adminUserId,
      action: 'CREATE_INSURANCE_PROVIDER',
      resource: 'insurance_providers',
      details: `Central Admin added insurance provider ${provider.name} (${provider.code})`,
    });

    return provider;
  }

  static async getHospitalAcceptedInsurances(hospitalId: number) {
    const list = await db
      .select({
        id: hospitalInsurances.id,
        hospitalId: hospitalInsurances.hospitalId,
        providerId: hospitalInsurances.providerId,
        providerName: insuranceProviders.name,
        providerCode: insuranceProviders.code,
        coverageType: insuranceProviders.coverageType,
        isCashlessSupported: hospitalInsurances.isCashlessSupported,
        copayPercentage: hospitalInsurances.copayPercentage,
      })
      .from(hospitalInsurances)
      .innerJoin(insuranceProviders, eq(hospitalInsurances.providerId, insuranceProviders.id))
      .where(eq(hospitalInsurances.hospitalId, hospitalId));

    return list;
  }

  static async addHospitalInsurance(data: {
    hospitalId: number;
    providerId: number;
    isCashlessSupported?: boolean;
    copayPercentage?: number;
  }, staffUserId: number) {
    // Check if already tied
    const [existing] = await db
      .select()
      .from(hospitalInsurances)
      .where(
        and(
          eq(hospitalInsurances.hospitalId, data.hospitalId),
          eq(hospitalInsurances.providerId, data.providerId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(hospitalInsurances)
        .set({
          isCashlessSupported: data.isCashlessSupported ?? existing.isCashlessSupported,
          copayPercentage: data.copayPercentage ?? existing.copayPercentage,
        })
        .where(eq(hospitalInsurances.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(hospitalInsurances)
      .values({
        hospitalId: data.hospitalId,
        providerId: data.providerId,
        isCashlessSupported: data.isCashlessSupported ?? true,
        copayPercentage: data.copayPercentage ?? 10,
      })
      .returning();

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: staffUserId,
      action: 'ADD_HOSPITAL_INSURANCE',
      resource: 'hospital_insurances',
      details: `Linked insurance provider #${data.providerId} to hospital #${data.hospitalId}`,
    });

    return created;
  }

  static async getPatientInsurances(patientUserId: number) {
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientUserId))
      .limit(1);

    if (!patient) return [];

    const list = await db
      .select({
        id: patientInsurances.id,
        patientId: patientInsurances.patientId,
        providerId: patientInsurances.providerId,
        providerName: insuranceProviders.name,
        providerCode: insuranceProviders.code,
        coverageType: insuranceProviders.coverageType,
        policyNumber: patientInsurances.policyNumber,
        validUntil: patientInsurances.validUntil,
        coverageAmount: patientInsurances.coverageAmount,
        status: patientInsurances.status,
      })
      .from(patientInsurances)
      .innerJoin(insuranceProviders, eq(patientInsurances.providerId, insuranceProviders.id))
      .where(eq(patientInsurances.patientId, patient.id));

    return list;
  }

  static async addPatientInsurance(data: {
    patientUserId: number;
    providerId: number;
    policyNumber: string;
    validUntil: string;
    coverageAmount: number;
  }) {
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, data.patientUserId))
      .limit(1);

    if (!patient) throw new Error('Patient profile not found.');

    const [created] = await db
      .insert(patientInsurances)
      .values({
        patientId: patient.id,
        providerId: data.providerId,
        policyNumber: data.policyNumber.trim(),
        validUntil: data.validUntil,
        coverageAmount: data.coverageAmount,
        status: 'VERIFIED',
      })
      .returning();

    return created;
  }

  static async checkHospitalInsuranceCoverage(hospitalId: number, patientUserId: number) {
    const patientPolicies = await this.getPatientInsurances(patientUserId);
    const hospitalTied = await this.getHospitalAcceptedInsurances(hospitalId);

    const hospitalProviderIds = new Set(hospitalTied.map((h) => h.providerId));
    const matchingPolicies = patientPolicies.filter((p) => hospitalProviderIds.has(p.providerId));

    return {
      isSupported: matchingPolicies.length > 0,
      matchingPolicies,
      hospitalAcceptedProviders: hospitalTied,
    };
  }
}
