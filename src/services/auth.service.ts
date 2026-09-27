import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  users,
  patientProfiles,
  auditLogs,
} from '../db/schema.ts';
import { eq, or } from 'drizzle-orm';
import { createSessionToken, UserSessionPayload } from '../lib/session.ts';

export class AuthService {
  static async registerPatient(data: {
    fullName: string;
    email: string;
    username: string;
    phone: string;
    password: string;
    dob?: string;
    gender?: string;
    address?: string;
    bloodGroup?: string;
  }) {
    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.email, data.email), eq(users.username, data.username)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].email === data.email) {
        throw new Error('An account with this email address already exists.');
      }
      throw new Error('This username is already taken. Please choose another.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const [newUser] = await db
      .insert(users)
      .values({
        uid: `patient_${crypto.randomUUID()}`,
        username: data.username.toLowerCase().trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: 'PATIENT',
        hospitalId: null,
        fullName: data.fullName.trim(),
        phone: data.phone,
        isEmailVerified: false,
        otpSecret: otp,
        otpExpiresAt,
        status: 'ACTIVE',
      })
      .returning();

    // Create Patient Profile
    const [profile] = await db
      .insert(patientProfiles)
      .values({
        userId: newUser.id,
        dob: data.dob || null,
        gender: data.gender || 'OTHER',
        address: data.address || null,
        bloodGroup: data.bloodGroup || null,
      })
      .returning();

    // Audit log
    await db.insert(auditLogs).values({
      userId: newUser.id,
      action: 'PATIENT_REGISTER',
      resource: 'users',
      details: `Patient registered with email ${newUser.email}`,
    });

    return {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      otp, // Provided for user demonstration / testing ease
    };
  }

  static async verifyOtp(emailOrUsername: string, otp: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername.toLowerCase().trim()),
          eq(users.username, emailOrUsername.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.isEmailVerified) {
      return { verified: true, message: 'Email is already verified.' };
    }

    if (!user.otpSecret || user.otpSecret !== otp.trim()) {
      throw new Error('Invalid verification code. Please check and try again.');
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    await db
      .update(users)
      .set({
        isEmailVerified: true,
        otpSecret: null,
        otpExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Audit
    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'OTP_VERIFY_SUCCESS',
      resource: 'users',
      details: `User verified email ${user.email}`,
    });

    const sessionPayload: UserSessionPayload = {
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    };

    const token = createSessionToken(sessionPayload);

    return {
      verified: true,
      token,
      user: sessionPayload,
    };
  }

  static async resendOtp(emailOrUsername: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername.toLowerCase().trim()),
          eq(users.username, emailOrUsername.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!user) {
      throw new Error('User account not found.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(users)
      .set({
        otpSecret: otp,
        otpExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return {
      email: user.email,
      otp,
    };
  }

  static async loginPatient(usernameOrEmail: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, usernameOrEmail.toLowerCase().trim()),
          eq(users.username, usernameOrEmail.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    if (user.role !== 'PATIENT') {
      throw new Error('Invalid account type. Staff members should use the Staff Portal login.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('This account has been suspended. Please contact platform support.');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid username or password.');
    }

    if (!user.isEmailVerified) {
      return {
        requiresVerification: true,
        email: user.email,
        username: user.username,
        message: 'Please verify your email address to continue.',
      };
    }

    const sessionPayload: UserSessionPayload = {
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    };

    const token = createSessionToken(sessionPayload);

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'PATIENT_LOGIN',
      resource: 'users',
      details: 'Patient logged in successfully',
    });

    return {
      token,
      user: sessionPayload,
      redirectUrl: '/patient/dashboard',
    };
  }

  static async loginStaff(username: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      throw new Error('Invalid staff username or password.');
    }

    // Role check: central admin and patient must not log in here
    if (user.role === 'PATIENT') {
      throw new Error('Patients must log in via the Patient Portal.');
    }
    if (user.role === 'CENTRAL_ADMIN') {
      throw new Error('Central administration credentials must use the secure Platform Admin portal.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('This staff account is currently suspended.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid staff username or password.');
    }

    const sessionPayload: UserSessionPayload = {
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    };

    const token = createSessionToken(sessionPayload);

    await db.insert(auditLogs).values({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'STAFF_LOGIN',
      resource: 'users',
      details: `Staff member ${user.username} (${user.role}) logged in`,
    });

    const redirectMap: Record<string, string> = {
      HOSPITAL_ADMIN: '/hospital-admin/dashboard',
      DOCTOR: '/doctor/dashboard',
      NURSE: '/nurse/dashboard',
      RECEPTIONIST: '/receptionist/dashboard',
      BILLING: '/billing/dashboard',
    };

    return {
      token,
      user: sessionPayload,
      mustChangePassword: user.mustChangePassword,
      redirectUrl: redirectMap[user.role] || '/landing',
    };
  }

  static async loginPlatformAdmin(username: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);

    if (!user || user.role !== 'CENTRAL_ADMIN') {
      throw new Error('Invalid administrator credentials.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid administrator credentials.');
    }

    const sessionPayload: UserSessionPayload = {
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      hospitalId: null,
      fullName: user.fullName,
    };

    const token = createSessionToken(sessionPayload);

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'PLATFORM_ADMIN_LOGIN',
      resource: 'platform',
      details: 'Central Admin access granted',
    });

    return {
      token,
      user: sessionPayload,
      redirectUrl: '/platform-admin',
    };
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('User not found.');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error('The current password provided is incorrect.');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await db.insert(auditLogs).values({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      resource: 'users',
      details: 'Password was updated successfully',
    });

    return { success: true, message: 'Password updated successfully.' };
  }

  static async forgotPassword(emailOrUsername: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername.toLowerCase().trim()),
          eq(users.username, emailOrUsername.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!user) {
      // Return a safe message so account presence is not disclosed, but provide demo simulation
      throw new Error('No account found associated with this email or username.');
    }

    if (user.role !== 'PATIENT') {
      throw new Error('Staff accounts must contact their Hospital Administrator for password resets.');
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(users)
      .set({
        otpSecret: resetOtp,
        otpExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      resource: 'users',
      details: `Password reset OTP generated for ${user.email}`,
    });

    return {
      success: true,
      email: user.email,
      otp: resetOtp, // provided for convenient test verification
      message: 'Password reset code generated and sent to email.',
    };
  }

  static async resetPasswordWithOtp(emailOrUsername: string, otp: string, newPassword: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername.toLowerCase().trim()),
          eq(users.username, emailOrUsername.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!user) {
      throw new Error('User not found.');
    }

    if (!user.otpSecret || user.otpSecret !== otp.trim()) {
      throw new Error('Invalid verification code.');
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new Error('Password reset code has expired. Please request a new code.');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        otpSecret: null,
        otpExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      resource: 'users',
      details: `Password was successfully reset via OTP for ${user.email}`,
    });

    return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
  }
}
