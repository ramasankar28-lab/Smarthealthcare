import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  users,
  doctorProfiles,
  nurseProfiles,
  receptionistProfiles,
  billingProfiles,
  staffAssignments,
  departments,
  auditLogs,
} from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export class StaffService {
  static async listHospitalStaff(hospitalId: number) {
    const staffUsers = await db
      .select({
        id: users.id,
        uid: users.uid,
        username: users.username,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
        phone: users.phone,
        status: users.status,
        mustChangePassword: users.mustChangePassword,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.hospitalId, hospitalId)))
      .orderBy(users.role, users.fullName);

    // Enrich with specific profile data
    const enriched = await Promise.all(
      staffUsers.map(async (st) => {
        let details: Record<string, any> = {};
        if (st.role === 'DOCTOR') {
          const [doc] = await db
            .select()
            .from(doctorProfiles)
            .where(eq(doctorProfiles.userId, st.id))
            .limit(1);
          if (doc) details = doc;
        } else if (st.role === 'NURSE') {
          const [nurse] = await db
            .select()
            .from(nurseProfiles)
            .where(eq(nurseProfiles.userId, st.id))
            .limit(1);
          if (nurse) details = nurse;
        } else if (st.role === 'RECEPTIONIST') {
          const [rec] = await db
            .select()
            .from(receptionistProfiles)
            .where(eq(receptionistProfiles.userId, st.id))
            .limit(1);
          if (rec) details = rec;
        } else if (st.role === 'BILLING') {
          const [bil] = await db
            .select()
            .from(billingProfiles)
            .where(eq(billingProfiles.userId, st.id))
            .limit(1);
          if (bil) details = bil;
        }
        return {
          ...st,
          profile: details,
        };
      })
    );

    return enriched;
  }

  static async createStaffMember(
    adminUserId: number,
    hospitalId: number,
    data: {
      username: string;
      email: string;
      fullName: string;
      phone?: string;
      role: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'BILLING';
      temporaryPassword: string;
      departmentId?: number;
      specialty?: string;
      qualification?: string;
      consultationFee?: number;
      roomNumber?: string;
      station?: string;
      shift?: string;
      deskNumber?: string;
      counterNumber?: string;
    }
  ) {
    // Check if role is permissible
    if (!['DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING'].includes(data.role)) {
      throw new Error('Hospital Admin can only create Doctor, Nurse, Receptionist, or Billing Staff.');
    }

    // Check unique username and email
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const passwordHash = await bcrypt.hash(data.temporaryPassword, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        uid: `staff_${crypto.randomUUID()}`,
        username: data.username.toLowerCase().trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role,
        hospitalId,
        fullName: data.fullName.trim(),
        phone: data.phone || null,
        mustChangePassword: true, // Required first login change
        isEmailVerified: true,
        status: 'ACTIVE',
      })
      .returning();

    // Create role-specific profile
    if (data.role === 'DOCTOR') {
      if (!data.departmentId) throw new Error('Department is required for Doctor.');
      await db.insert(doctorProfiles).values({
        userId: newUser.id,
        hospitalId,
        departmentId: data.departmentId,
        specialty: data.specialty || 'General Medicine',
        qualification: data.qualification || 'MD / MBBS',
        consultationFee: data.consultationFee || 60,
        roomNumber: data.roomNumber || 'Room 101',
      });
    } else if (data.role === 'NURSE') {
      await db.insert(nurseProfiles).values({
        userId: newUser.id,
        hospitalId,
        departmentId: data.departmentId || null,
        shift: data.shift || 'MORNING',
        station: data.station || 'Station A',
      });
    } else if (data.role === 'RECEPTIONIST') {
      await db.insert(receptionistProfiles).values({
        userId: newUser.id,
        hospitalId,
        deskNumber: data.deskNumber || 'Front Desk 1',
      });
    } else if (data.role === 'BILLING') {
      await db.insert(billingProfiles).values({
        userId: newUser.id,
        hospitalId,
        counterNumber: data.counterNumber || 'Counter B1',
      });
    }

    // Staff assignment record
    if (data.departmentId || data.shift) {
      await db.insert(staffAssignments).values({
        hospitalId,
        userId: newUser.id,
        departmentId: data.departmentId || null,
        shiftName: data.shift || 'REGULAR',
        effectiveFrom: new Date().toISOString().split('T')[0],
      });
    }

    await db.insert(auditLogs).values({
      hospitalId,
      userId: adminUserId,
      action: 'CREATE_STAFF_MEMBER',
      resource: 'users',
      details: `Created staff member ${newUser.username} as ${newUser.role}`,
    });

    return {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      fullName: newUser.fullName,
      temporaryPassword: data.temporaryPassword,
    };
  }

  static async toggleStaffStatus(
    staffId: number,
    status: 'ACTIVE' | 'SUSPENDED',
    hospitalId: number,
    adminUserId: number
  ) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, staffId), eq(users.hospitalId, hospitalId)))
      .limit(1);

    if (!user) throw new Error('Staff member not found in your hospital.');

    const [updated] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, staffId))
      .returning();

    await db.insert(auditLogs).values({
      hospitalId,
      userId: adminUserId,
      action: 'TOGGLE_STAFF_STATUS',
      resource: 'users',
      details: `Staff member #${staffId} status set to ${status}`,
    });

    return updated;
  }
}
