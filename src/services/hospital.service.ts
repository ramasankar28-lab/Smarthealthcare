import { db } from '../db/index.ts';
import {
  hospitals,
  departments,
  doctorProfiles,
  hospitalInsurances,
  insuranceProviders,
  hospitalUpdates,
  auditLogs,
  users,
} from '../db/schema.ts';
import { eq, and, ilike, desc } from 'drizzle-orm';

export class HospitalService {
  static async listHospitals(filters?: {
    city?: string;
    search?: string;
    insuranceProviderId?: number;
    emergencyOnly?: boolean;
    status?: string;
  }) {
    let query = db.select().from(hospitals);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(hospitals.status, filters.status));
    } else {
      conditions.push(eq(hospitals.status, 'ACTIVE'));
    }

    if (filters?.city) {
      conditions.push(ilike(hospitals.city, `%${filters.city}%`));
    }

    if (filters?.emergencyOnly) {
      conditions.push(eq(hospitals.emergencyAvailable, true));
    }

    if (filters?.search) {
      conditions.push(ilike(hospitals.name, `%${filters.search}%`));
    }

    let results = await (conditions.length > 0
      ? db.select().from(hospitals).where(and(...conditions))
      : db.select().from(hospitals));

    // If insurance filter is passed, filter hospitals that support this provider
    if (filters?.insuranceProviderId) {
      const hospitalIdsWithInsurance = await db
        .select({ hospitalId: hospitalInsurances.hospitalId })
        .from(hospitalInsurances)
        .where(eq(hospitalInsurances.providerId, Number(filters.insuranceProviderId)));

      const allowedSet = new Set(hospitalIdsWithInsurance.map((h) => h.hospitalId));
      results = results.filter((h) => allowedSet.has(h.id));
    }

    // Attach accepted insurance names and department counts
    const enhanced = await Promise.all(
      results.map(async (h) => {
        const ins = await db
          .select({
            id: insuranceProviders.id,
            name: insuranceProviders.name,
            code: insuranceProviders.code,
            isCashless: hospitalInsurances.isCashlessSupported,
            copayPercentage: hospitalInsurances.copayPercentage,
          })
          .from(hospitalInsurances)
          .innerJoin(insuranceProviders, eq(hospitalInsurances.providerId, insuranceProviders.id))
          .where(eq(hospitalInsurances.hospitalId, h.id));

        const depts = await db
          .select()
          .from(departments)
          .where(eq(departments.hospitalId, h.id));

        return {
          ...h,
          acceptedInsurances: ins,
          departmentsCount: depts.length,
        };
      })
    );

    return enhanced;
  }

  static async getHospitalById(id: number) {
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.id, id))
      .limit(1);

    if (!hospital) {
      throw new Error('Hospital not found.');
    }

    const depts = await db
      .select()
      .from(departments)
      .where(eq(departments.hospitalId, id));

    const doctors = await db
      .select({
        id: doctorProfiles.id,
        specialty: doctorProfiles.specialty,
        qualification: doctorProfiles.qualification,
        experienceYears: doctorProfiles.experienceYears,
        consultationFee: doctorProfiles.consultationFee,
        roomNumber: doctorProfiles.roomNumber,
        bio: doctorProfiles.bio,
        isAvailable: doctorProfiles.isAvailable,
        fullName: users.fullName,
        departmentId: doctorProfiles.departmentId,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(doctorProfiles.hospitalId, id));

    const acceptedInsurances = await db
      .select({
        id: insuranceProviders.id,
        name: insuranceProviders.name,
        code: insuranceProviders.code,
        isCashlessSupported: hospitalInsurances.isCashlessSupported,
        copayPercentage: hospitalInsurances.copayPercentage,
      })
      .from(hospitalInsurances)
      .innerJoin(insuranceProviders, eq(hospitalInsurances.providerId, insuranceProviders.id))
      .where(eq(hospitalInsurances.hospitalId, id));

    const updates = await db
      .select()
      .from(hospitalUpdates)
      .where(and(eq(hospitalUpdates.hospitalId, id), eq(hospitalUpdates.isPublic, true)))
      .orderBy(desc(hospitalUpdates.createdAt))
      .limit(5);

    return {
      ...hospital,
      departments: depts,
      doctors,
      acceptedInsurances,
      updates,
    };
  }

  static async updateHospitalBeds(
    hospitalId: number,
    data: { totalBeds?: number; availableBeds?: number; emergencyAvailable?: boolean },
    userId: number
  ) {
    const [updated] = await db
      .update(hospitals)
      .set(data)
      .where(eq(hospitals.id, hospitalId))
      .returning();

    await db.insert(auditLogs).values({
      hospitalId,
      userId,
      action: 'UPDATE_HOSPITAL_STATUS',
      resource: 'hospitals',
      details: `Bed status updated: Available=${data.availableBeds}, Total=${data.totalBeds}`,
    });

    return updated;
  }

  static async createHospital(data: {
    code: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    email: string;
    totalBeds?: number;
    availableBeds?: number;
    emergencyAvailable?: boolean;
    description?: string;
  }, adminUserId: number) {
    const [newHospital] = await db
      .insert(hospitals)
      .values({
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        city: data.city.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        totalBeds: data.totalBeds || 100,
        availableBeds: data.availableBeds || 20,
        emergencyAvailable: data.emergencyAvailable ?? true,
        description: data.description,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(auditLogs).values({
      hospitalId: newHospital.id,
      userId: adminUserId,
      action: 'CREATE_HOSPITAL',
      resource: 'hospitals',
      details: `Platform admin created hospital ${newHospital.name} (${newHospital.code})`,
    });

    return newHospital;
  }

  static async toggleHospitalStatus(hospitalId: number, status: 'ACTIVE' | 'SUSPENDED', adminUserId: number) {
    const [updated] = await db
      .update(hospitals)
      .set({ status })
      .where(eq(hospitals.id, hospitalId))
      .returning();

    await db.insert(auditLogs).values({
      hospitalId,
      userId: adminUserId,
      action: status === 'ACTIVE' ? 'ACTIVATE_HOSPITAL' : 'SUSPEND_HOSPITAL',
      resource: 'hospitals',
      details: `Hospital status set to ${status}`,
    });

    return updated;
  }
}
