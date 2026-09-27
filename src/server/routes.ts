import express, { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.ts';
import { HospitalService } from '../services/hospital.service.ts';
import { AppointmentService } from '../services/appointment.service.ts';
import { QueueService } from '../services/queue.service.ts';
import { BillingService } from '../services/billing.service.ts';
import { InsuranceService } from '../services/insurance.service.ts';
import { PatientService } from '../services/patient.service.ts';
import { StaffService } from '../services/staff.service.ts';
import { AnalyticsService } from '../services/analytics.service.ts';
import { NotificationService } from '../services/notification.service.ts';
import { SmartCareService } from '../services/smartcare.service.ts';
import {
  requireAuth,
  requireRole,
  requireHospitalAccess,
  AuthRequest,
} from '../middleware/auth.ts';
import { db } from '../db/index.ts';
import { departments, doctorProfiles, users, patientProfiles } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export const apiRouter = express.Router();

// Helper to set session cookie
const setAuthCookie = (res: Response, token: string) => {
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
};

/* ==========================================================================
   1. AUTHENTICATION ROUTES
   ========================================================================== */

// Patient Registration
apiRouter.post('/auth/register-patient', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      fullName: z.string().min(2, 'Full name is required'),
      email: z.string().email('Valid email is required'),
      username: z.string().min(3, 'Username must be at least 3 characters'),
      phone: z.string().min(7, 'Mobile phone number is required'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      dob: z.string().optional(),
      gender: z.string().optional(),
      address: z.string().optional(),
      bloodGroup: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await AuthService.registerPatient(data);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed.' });
  }
});

// Patient OTP Verification
apiRouter.post('/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      emailOrUsername: z.string().min(1, 'Email or username is required'),
      otp: z.string().min(6, '6-digit OTP code is required'),
    });

    const { emailOrUsername, otp } = schema.parse(req.body);
    const result = await AuthService.verifyOtp(emailOrUsername, otp);
    if (result.token) {
      setAuthCookie(res, result.token);
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'OTP verification failed.' });
  }
});

// Resend OTP
apiRouter.post('/auth/resend-otp', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      emailOrUsername: z.string().min(1),
    });
    const { emailOrUsername } = schema.parse(req.body);
    const result = await AuthService.resendOtp(emailOrUsername);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to resend OTP.' });
  }
});

// Patient Login
apiRouter.post('/auth/patient-login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      usernameOrEmail: z.string().min(1, 'Username or email is required'),
      password: z.string().min(1, 'Password is required'),
    });

    const { usernameOrEmail, password } = schema.parse(req.body);
    const result = await AuthService.loginPatient(usernameOrEmail, password);
    if ('token' in result && result.token) {
      setAuthCookie(res, result.token);
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Patient login failed.' });
  }
});

// Patient Forgot Password (Generate OTP)
apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      emailOrUsername: z.string().min(1, 'Email or username is required'),
    });
    const { emailOrUsername } = schema.parse(req.body);
    const result = await AuthService.forgotPassword(emailOrUsername);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Forgot password request failed.' });
  }
});

// Patient Reset Password with OTP
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      emailOrUsername: z.string().min(1, 'Email or username is required'),
      otp: z.string().min(6, '6-digit OTP code is required'),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    });
    const { emailOrUsername, otp, newPassword } = schema.parse(req.body);
    const result = await AuthService.resetPasswordWithOtp(emailOrUsername, otp, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reset password.' });
  }
});

// Staff Login (One common login for Hospital Admin, Doctor, Nurse, Receptionist, Billing)
apiRouter.post('/auth/staff-login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
    });

    const { username, password } = schema.parse(req.body);
    const result = await AuthService.loginStaff(username, password);
    setAuthCookie(res, result.token);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Staff login failed.' });
  }
});

// Central Admin Login (Protected /platform-admin entry point)
apiRouter.post('/auth/platform-admin-login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    });

    const { username, password } = schema.parse(req.body);
    const result = await AuthService.loginPlatformAdmin(username, password);
    setAuthCookie(res, result.token);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid administrator credentials.' });
  }
});

// Change Password (Used for first-time staff temporary password reset & normal changes)
apiRouter.post('/auth/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);
    const result = await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update password.' });
  }
});

// Current User Session
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // If patient, also attach patient profile ID
    let patientProfileId = null;
    if (req.user?.role === 'PATIENT') {
      const [p] = await db
        .select()
        .from(patientProfiles)
        .where(eq(patientProfiles.userId, req.user.id))
        .limit(1);
      if (p) patientProfileId = p.id;
    }

    res.json({
      user: {
        ...req.user,
        patientProfileId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve session details.' });
  }
});

// Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('session_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Get Patient Profile Details
apiRouter.get(
  '/patient/me/profile',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = await PatientService.getPatientProfile(req.user!.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load profile.' });
    }
  }
);

// Update Patient Profile Details
apiRouter.put(
  '/patient/me/profile',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        fullName: z.string().min(2).optional(),
        phone: z.string().optional(),
        dob: z.string().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        bloodGroup: z.string().optional(),
        emergencyContact: z.string().optional(),
        allergies: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const updated = await PatientService.updatePatientProfile(req.user!.id, data);
      res.json({ success: true, updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update profile.' });
    }
  }
);

// Comprehensive Patient Dashboard Overview
apiRouter.get(
  '/patient/me/dashboard',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const patientUserId = req.user!.id;

      // 1. Patient profile
      const profileData = await PatientService.getPatientProfile(patientUserId);

      // 2. Patient appointments
      const appointmentsList = await AppointmentService.getPatientAppointments(patientUserId);

      // Next appointment: earliest CONFIRMED or CHECKED_IN
      const upcomingApts = appointmentsList
        .filter((apt) => ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(apt.status))
        .sort((a, b) => {
          const dateDiff = a.appointmentDate.localeCompare(b.appointmentDate);
          if (dateDiff !== 0) return dateDiff;
          return a.appointmentTime.localeCompare(b.appointmentTime);
        });

      const nextAppointment = upcomingApts.length > 0 ? upcomingApts[0] : null;

      // 3. Outstanding bills
      const billsList = await BillingService.getPatientBills(patientUserId);
      const pendingBills = billsList.filter(
        (b) => b.status === 'PENDING' || b.status === 'PARTIALLY_PAID'
      );
      const totalOutstanding = pendingBills.reduce(
        (acc, b) => acc + (b.netPayable - (b.paidAmount || 0)),
        0
      );

      // 4. Hospital announcements & updates
      const hospitalUpdatesList = await NotificationService.getHospitalUpdates();

      // 5. Patient Insurances count
      const insurancesList = await InsuranceService.getPatientInsurances(patientUserId);

      // 6. Recent activity timeline
      const notificationsList = await NotificationService.getUserNotifications(patientUserId);

      const activities: Array<{
        id: string;
        type: 'APPOINTMENT' | 'BILL' | 'PAYMENT' | 'NOTIFICATION';
        title: string;
        description: string;
        timestamp: string | Date;
        status?: string;
      }> = [];

      for (const apt of appointmentsList.slice(0, 4)) {
        activities.push({
          id: `apt-${apt.id}`,
          type: 'APPOINTMENT',
          title: `Appointment with Dr. ${apt.doctorName || 'Assigned Physician'}`,
          description: `${apt.hospitalName} • ${apt.departmentName} (${apt.appointmentDate} at ${apt.appointmentTime})`,
          timestamp: apt.createdAt || apt.appointmentDate,
          status: apt.status,
        });
      }

      for (const b of billsList.slice(0, 3)) {
        activities.push({
          id: `bill-${b.id}`,
          type: b.status === 'PAID' ? 'PAYMENT' : 'BILL',
          title: b.status === 'PAID' ? `Payment Receipt #${b.billNumber}` : `Invoice #${b.billNumber}`,
          description: `${b.hospitalName} • $${b.netPayable}`,
          timestamp: b.createdAt || new Date(),
          status: b.status,
        });
      }

      for (const n of notificationsList.slice(0, 3)) {
        activities.push({
          id: `notif-${n.id}`,
          type: 'NOTIFICATION',
          title: n.title,
          description: n.message,
          timestamp: n.createdAt,
        });
      }

      activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json({
        greeting: {
          fullName: profileData.user.fullName,
          email: profileData.user.email,
          phone: profileData.user.phone,
          bloodGroup: profileData.profile?.bloodGroup || 'Not specified',
          allergies: profileData.profile?.allergies || 'None recorded',
          emergencyContact: profileData.profile?.emergencyContact || 'Not specified',
          dob: profileData.profile?.dob,
          gender: profileData.profile?.gender,
          address: profileData.profile?.address,
        },
        nextAppointment,
        outstandingBills: {
          count: pendingBills.length,
          totalAmount: totalOutstanding,
          bills: pendingBills,
        },
        recentActivity: activities.slice(0, 8),
        hospitalUpdates: hospitalUpdatesList.slice(0, 5),
        totalAppointmentsCount: appointmentsList.length,
        activeInsurancesCount: insurancesList.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard overview.' });
    }
  }
);

/* ==========================================================================
   2. HOSPITAL DISCOVERY & MANAGEMENT
   ========================================================================== */

// List Hospitals (Public / Patient Discovery)
apiRouter.get('/hospitals', async (req: Request, res: Response) => {
  try {
    const { city, search, insuranceProviderId, emergencyOnly, status } = req.query;
    const list = await HospitalService.listHospitals({
      city: city as string,
      search: search as string,
      insuranceProviderId: insuranceProviderId ? Number(insuranceProviderId) : undefined,
      emergencyOnly: emergencyOnly === 'true',
      status: status as string,
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch hospitals.' });
  }
});

// Get Single Hospital Details
apiRouter.get('/hospitals/:id', async (req: Request, res: Response) => {
  try {
    const hospital = await HospitalService.getHospitalById(Number(req.params.id));
    res.json(hospital);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Hospital not found.' });
  }
});

// Update Hospital Bed Capacity (Hospital Admin only for their own hospital, or Central Admin)
apiRouter.put(
  '/hospitals/:hospitalId/beds',
  requireAuth,
  requireRole('HOSPITAL_ADMIN', 'CENTRAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        totalBeds: z.number().optional(),
        availableBeds: z.number().optional(),
        emergencyAvailable: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const updated = await HospitalService.updateHospitalBeds(
        Number(req.params.hospitalId),
        data,
        req.user!.id
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update bed status.' });
    }
  }
);

// Create Hospital (Central Admin Only)
apiRouter.post(
  '/hospitals',
  requireAuth,
  requireRole('CENTRAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        code: z.string().min(2),
        name: z.string().min(3),
        city: z.string().min(2),
        address: z.string().min(3),
        phone: z.string().min(7),
        email: z.string().email(),
        totalBeds: z.number().optional(),
        availableBeds: z.number().optional(),
        emergencyAvailable: z.boolean().optional(),
        description: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const hospital = await HospitalService.createHospital(data, req.user!.id);
      res.json(hospital);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create hospital.' });
    }
  }
);

// Toggle Hospital Activation / Suspension (Central Admin Only)
apiRouter.put(
  '/hospitals/:id/status',
  requireAuth,
  requireRole('CENTRAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        status: z.enum(['ACTIVE', 'SUSPENDED']),
      });
      const { status } = schema.parse(req.body);
      const updated = await HospitalService.toggleHospitalStatus(
        Number(req.params.id),
        status,
        req.user!.id
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update hospital status.' });
    }
  }
);

// Get Departments in a Hospital
apiRouter.get('/hospitals/:hospitalId/departments', async (req: Request, res: Response) => {
  try {
    const depts = await db
      .select()
      .from(departments)
      .where(eq(departments.hospitalId, Number(req.params.hospitalId)));
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

// Create Department in Hospital (Hospital Admin only)
apiRouter.post(
  '/hospitals/:hospitalId/departments',
  requireAuth,
  requireRole('HOSPITAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        headDoctorName: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const [dept] = await db
        .insert(departments)
        .values({
          hospitalId: Number(req.params.hospitalId),
          name: data.name,
          description: data.description,
          headDoctorName: data.headDoctorName,
        })
        .returning();
      res.json(dept);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create department.' });
    }
  }
);

// Get Doctors in a Hospital
apiRouter.get('/hospitals/:hospitalId/doctors', async (req: Request, res: Response) => {
  try {
    const docs = await db
      .select({
        id: doctorProfiles.id,
        userId: doctorProfiles.userId,
        hospitalId: doctorProfiles.hospitalId,
        departmentId: doctorProfiles.departmentId,
        specialty: doctorProfiles.specialty,
        qualification: doctorProfiles.qualification,
        experienceYears: doctorProfiles.experienceYears,
        consultationFee: doctorProfiles.consultationFee,
        roomNumber: doctorProfiles.roomNumber,
        bio: doctorProfiles.bio,
        isAvailable: doctorProfiles.isAvailable,
        fullName: users.fullName,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(doctorProfiles.hospitalId, Number(req.params.hospitalId)));
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch doctors.' });
  }
});

// Get Doctor Appointment Slots
apiRouter.get('/doctors/:doctorId/slots', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    const slots = await AppointmentService.getDoctorSlots(Number(req.params.doctorId), targetDate);
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch appointment slots.' });
  }
});

/* ==========================================================================
   3. APPOINTMENTS
   ========================================================================== */

// Book Appointment (Patient Only)
apiRouter.post(
  '/appointments',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        hospitalId: z.number(),
        doctorId: z.number(),
        departmentId: z.number(),
        slotId: z.number().optional(),
        appointmentDate: z.string(),
        appointmentTime: z.string(),
        reason: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const result = await AppointmentService.bookAppointment({
        ...data,
        patientUserId: req.user!.id,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Appointment booking failed.' });
    }
  }
);

// Patient Appointments (Patient Only)
apiRouter.get(
  '/appointments/patient/me',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const list = await AppointmentService.getPatientAppointments(req.user!.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch appointments.' });
    }
  }
);

// Hospital Appointments (Staff Only for their hospital)
apiRouter.get(
  '/appointments/hospital/:hospitalId',
  requireAuth,
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { date, departmentId, doctorId, status } = req.query;
      const list = await AppointmentService.getHospitalAppointments(
        Number(req.params.hospitalId),
        {
          date: date as string,
          departmentId: departmentId ? Number(departmentId) : undefined,
          doctorId: doctorId ? Number(doctorId) : undefined,
          status: status as string,
        }
      );
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch hospital appointments.' });
    }
  }
);

// Update Appointment Status (Doctor / Receptionist / Hospital Admin)
apiRouter.put(
  '/appointments/:id/status',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        hospitalId: z.number(),
        status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
        notes: z.string().optional(),
      });

      const { hospitalId, status, notes } = schema.parse(req.body);

      // Verify hospital tenancy
      if (req.user!.role !== 'CENTRAL_ADMIN' && req.user!.hospitalId !== hospitalId) {
        return res.status(403).json({ error: 'Tenant Violation: Access denied.' });
      }

      const updated = await AppointmentService.updateStatus(
        Number(req.params.id),
        status,
        hospitalId,
        req.user!.id,
        notes
      );

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update status.' });
    }
  }
);

// Cancel Appointment by Patient
apiRouter.put(
  '/appointments/:id/patient-cancel',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        reason: z.string().optional(),
      });
      const { reason } = schema.parse(req.body || {});
      const result = await AppointmentService.patientCancelAppointment(
        Number(req.params.id),
        req.user!.id,
        reason
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to cancel appointment.' });
    }
  }
);

/* ==========================================================================
   4. LIVE QUEUE TRACKING & MANAGEMENT
   ========================================================================== */

// Get Hospital Queues
apiRouter.get(
  '/queues/hospital/:hospitalId',
  requireAuth,
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { date } = req.query;
      const list = await QueueService.getHospitalQueues(
        Number(req.params.hospitalId),
        date as string
      );
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch hospital queues.' });
    }
  }
);

// Get Queue Details with Token Events
apiRouter.get(
  '/queues/:queueId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const hospitalId = req.user!.hospitalId || Number(req.query.hospitalId);
      const details = await QueueService.getQueueDetails(Number(req.params.queueId), hospitalId);
      res.json(details);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Queue not found.' });
    }
  }
);

// Call Next Patient Token (Doctor / Receptionist)
apiRouter.post(
  '/queues/:queueId/call-next',
  requireAuth,
  requireRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const hospitalId = req.user!.hospitalId!;
      const result = await QueueService.callNextToken(
        Number(req.params.queueId),
        hospitalId,
        req.user!.id
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to call next token.' });
    }
  }
);

// Update Queue Event Status
apiRouter.put(
  '/queues/events/:eventId/status',
  requireAuth,
  requireRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        status: z.enum(['WAITING', 'CALLED', 'IN_ROOM', 'COMPLETED', 'MISSED']),
      });
      const { status } = schema.parse(req.body);
      const hospitalId = req.user!.hospitalId!;
      const updated = await QueueService.updateEventStatus(
        Number(req.params.eventId),
        status,
        hospitalId,
        req.user!.id
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update token status.' });
    }
  }
);

// Public Patient Live Queue Tracker by Booking Reference
apiRouter.get('/queues/live/:reference', async (req: Request, res: Response) => {
  try {
    const live = await QueueService.getLiveQueueByAppointmentRef(req.params.reference);
    res.json(live);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'No queue found for this booking reference.' });
  }
});

/* ==========================================================================
   5. CLINICAL RECORDS, VITALS & CONSULTATIONS
   ========================================================================== */

// Record Patient Vitals (Nurse Only or Hospital Staff)
apiRouter.post(
  '/clinical/vitals',
  requireAuth,
  requireRole('NURSE', 'DOCTOR', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        patientId: z.number(),
        bloodPressure: z.string().optional(),
        heartRate: z.number().optional(),
        temperature: z.string().optional(),
        respiratoryRate: z.number().optional(),
        oxygenSaturation: z.number().optional(),
        weightKg: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const vital = await PatientService.recordVitals({
        ...data,
        hospitalId: req.user!.hospitalId!,
        nurseUserId: req.user!.id,
      });
      res.json(vital);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to record vitals.' });
    }
  }
);

// Get Patient Vitals
apiRouter.get('/clinical/vitals/:patientId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await PatientService.getPatientVitals(Number(req.params.patientId));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch vitals.' });
  }
});

// Record Consultation & Prescriptions (Doctor Only)
apiRouter.post(
  '/clinical/consultations',
  requireAuth,
  requireRole('DOCTOR', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        appointmentId: z.number(),
        patientId: z.number(),
        chiefComplaint: z.string().min(2),
        diagnosis: z.string().min(2),
        clinicalNotes: z.string().optional(),
        followUpDate: z.string().optional(),
        prescriptionsList: z
          .array(
            z.object({
              medicationName: z.string().min(1),
              dosage: z.string().min(1),
              frequency: z.string().min(1),
              durationDays: z.number().min(1),
              instructions: z.string().optional(),
            })
          )
          .optional(),
      });
      const data = schema.parse(req.body);
      const consult = await PatientService.recordConsultation({
        ...data,
        hospitalId: req.user!.hospitalId!,
        doctorUserId: req.user!.id,
      });
      res.json(consult);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to record consultation.' });
    }
  }
);

// Get Patient Consultations
apiRouter.get('/clinical/consultations/:patientId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await PatientService.getPatientConsultations(Number(req.params.patientId));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch consultations.' });
  }
});

// Add Medical Record
apiRouter.post(
  '/clinical/records',
  requireAuth,
  requireRole('DOCTOR', 'NURSE', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        patientId: z.number(),
        recordType: z.string().min(1),
        title: z.string().min(2),
        details: z.string().optional(),
        fileUrl: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const record = await PatientService.addMedicalRecord({
        ...data,
        hospitalId: req.user!.hospitalId!,
        staffUserId: req.user!.id,
      });
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to save record.' });
    }
  }
);

// Get Patient Medical Records
apiRouter.get('/clinical/records/:patientId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const records = await PatientService.getPatientMedicalRecords(Number(req.params.patientId));
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch medical records.' });
  }
});

// Post Hospital Review (Patient Only)
apiRouter.post(
  '/clinical/reviews',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        hospitalId: z.number(),
        doctorId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const review = await PatientService.addReview({
        ...data,
        patientUserId: req.user!.id,
      });
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to post review.' });
    }
  }
);

// Get Reviews (Public / Filtered by hospital)
apiRouter.get('/clinical/reviews', async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query;
    const list = await PatientService.getReviews(
      hospitalId ? Number(hospitalId) : undefined
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

/* ==========================================================================
   6. BILLING & PAYMENTS
   ========================================================================== */

// List Hospital Invoices (Billing Staff, Hospital Admin, Central Admin)
apiRouter.get(
  '/billing/hospital/:hospitalId',
  requireAuth,
  requireRole('BILLING', 'HOSPITAL_ADMIN', 'CENTRAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query;
      const list = await BillingService.getHospitalBills(
        Number(req.params.hospitalId),
        status as string
      );
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch invoices.' });
    }
  }
);

// Get Single Bill Details
apiRouter.get('/billing/bills/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await BillingService.getBillDetails(Number(req.params.id));
    res.json(bill);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Bill not found.' });
  }
});

// Add Item to Bill (Billing Staff)
apiRouter.post(
  '/billing/bills/:id/items',
  requireAuth,
  requireRole('BILLING', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        description: z.string().min(2),
        unitPrice: z.number().min(1),
        quantity: z.number().min(1).default(1),
      });
      const data = schema.parse(req.body);
      const updated = await BillingService.addBillItem(
        Number(req.params.id),
        data,
        req.user!.hospitalId!,
        req.user!.id
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to add bill item.' });
    }
  }
);

// Apply Insurance Claim Discount (Billing Staff or Patient)
apiRouter.post(
  '/billing/bills/:id/claim-insurance',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        patientInsuranceId: z.number(),
        hospitalId: z.number(),
      });
      const { patientInsuranceId, hospitalId } = schema.parse(req.body);
      const updated = await BillingService.applyInsuranceClaim(
        Number(req.params.id),
        patientInsuranceId,
        hospitalId,
        req.user!.id
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to apply insurance claim.' });
    }
  }
);

// Record Payment
apiRouter.post('/billing/payments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      billId: z.number(),
      hospitalId: z.number(),
      amount: z.number().min(1),
      paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING', 'CASH', 'INSURANCE_DIRECT']),
    });
    const data = schema.parse(req.body);

    const payment = await BillingService.recordPayment({
      ...data,
      patientUserId: req.user!.role === 'PATIENT' ? req.user!.id : undefined,
      staffUserId: req.user!.role !== 'PATIENT' ? req.user!.id : undefined,
    });
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Payment processing failed.' });
  }
});

// Process Refund (Billing Staff / Hospital Admin)
apiRouter.post(
  '/billing/refunds',
  requireAuth,
  requireRole('BILLING', 'HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        paymentId: z.number(),
        billId: z.number(),
        amount: z.number().min(1),
        reason: z.string().min(3),
      });
      const data = schema.parse(req.body);
      const refund = await BillingService.processRefund({
        ...data,
        hospitalId: req.user!.hospitalId!,
        staffUserId: req.user!.id,
      });
      res.json(refund);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Refund processing failed.' });
    }
  }
);

// Patient Bills (Patient Portal)
apiRouter.get(
  '/billing/patient/me',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const list = await BillingService.getPatientBills(req.user!.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch patient bills.' });
    }
  }
);

/* ==========================================================================
   7. INSURANCE DIRECTORY & PATIENT POLICIES
   ========================================================================== */

// Master Directory of Insurance Providers
apiRouter.get('/insurance/providers', async (req: Request, res: Response) => {
  try {
    const list = await InsuranceService.getProviders();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch insurance providers.' });
  }
});

// Add Insurance Provider (Central Admin Only)
apiRouter.post(
  '/insurance/providers',
  requireAuth,
  requireRole('CENTRAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        code: z.string().min(2),
        coverageType: z.string().min(2),
        supportContact: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const provider = await InsuranceService.createProvider(data, req.user!.id);
      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create provider.' });
    }
  }
);

// Hospital Accepted Insurances
apiRouter.get('/insurance/hospital/:hospitalId', async (req: Request, res: Response) => {
  try {
    const list = await InsuranceService.getHospitalAcceptedInsurances(
      Number(req.params.hospitalId)
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch hospital insurances.' });
  }
});

// Link Insurance to Hospital (Hospital Admin or Central Admin)
apiRouter.post(
  '/insurance/hospital/:hospitalId',
  requireAuth,
  requireRole('HOSPITAL_ADMIN', 'CENTRAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        providerId: z.number(),
        isCashlessSupported: z.boolean().optional(),
        copayPercentage: z.number().optional(),
      });
      const data = schema.parse(req.body);
      const linked = await InsuranceService.addHospitalInsurance(
        {
          hospitalId: Number(req.params.hospitalId),
          ...data,
        },
        req.user!.id
      );
      res.json(linked);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to link insurance.' });
    }
  }
);

// Patient Policies (Patient Only)
apiRouter.get(
  '/insurance/patient/me',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const list = await InsuranceService.getPatientInsurances(req.user!.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch patient insurances.' });
    }
  }
);

// Add Patient Insurance Policy (Patient Only)
apiRouter.post(
  '/insurance/patient/me',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        providerId: z.number(),
        policyNumber: z.string().min(3),
        validUntil: z.string(),
        coverageAmount: z.number().min(100),
      });
      const data = schema.parse(req.body);
      const policy = await InsuranceService.addPatientInsurance({
        ...data,
        patientUserId: req.user!.id,
      });
      res.json(policy);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to add insurance policy.' });
    }
  }
);

// Check if Patient's Insurance Covers Selected Hospital
apiRouter.get(
  '/insurance/check-coverage/:hospitalId',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const check = await InsuranceService.checkHospitalInsuranceCoverage(
        Number(req.params.hospitalId),
        req.user!.id
      );
      res.json(check);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to verify insurance coverage.' });
    }
  }
);

/* ==========================================================================
   8. STAFF MANAGEMENT (Hospital Admin Only)
   ========================================================================== */

// List Hospital Staff Members
apiRouter.get(
  '/staff/hospital/:hospitalId',
  requireAuth,
  requireRole('HOSPITAL_ADMIN', 'CENTRAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const staff = await StaffService.listHospitalStaff(Number(req.params.hospitalId));
      res.json(staff);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch staff members.' });
    }
  }
);

// Create Staff Member with Temporary Password (Hospital Admin creates Doctor, Nurse, Receptionist, Billing)
apiRouter.post(
  '/staff/hospital/:hospitalId',
  requireAuth,
  requireRole('HOSPITAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        fullName: z.string().min(2),
        phone: z.string().optional(),
        role: z.enum(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING']),
        temporaryPassword: z.string().min(6),
        departmentId: z.number().optional(),
        specialty: z.string().optional(),
        qualification: z.string().optional(),
        consultationFee: z.number().optional(),
        roomNumber: z.string().optional(),
        station: z.string().optional(),
        shift: z.string().optional(),
        deskNumber: z.string().optional(),
        counterNumber: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const newStaff = await StaffService.createStaffMember(
        req.user!.id,
        Number(req.params.hospitalId),
        data
      );
      res.json(newStaff);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create staff member.' });
    }
  }
);

// Toggle Staff Account Status
apiRouter.put(
  '/staff/:id/status',
  requireAuth,
  requireRole('HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        status: z.enum(['ACTIVE', 'SUSPENDED']),
      });
      const { status } = schema.parse(req.body);
      const updated = await StaffService.toggleStaffStatus(
        Number(req.params.id),
        status,
        req.user!.hospitalId!,
        req.user!.id
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update staff status.' });
    }
  }
);

/* ==========================================================================
   9. ANALYTICS & PLATFORM ADMINISTRATION
   ========================================================================== */

// Platform Network Overview (Central Admin Only)
apiRouter.get(
  '/analytics/platform',
  requireAuth,
  requireRole('CENTRAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await AnalyticsService.getPlatformNetworkOverview();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch platform analytics.' });
    }
  }
);

// Hospital Analytics (Hospital Admin / Central Admin)
apiRouter.get(
  '/analytics/hospital/:hospitalId',
  requireAuth,
  requireRole('HOSPITAL_ADMIN', 'CENTRAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await AnalyticsService.getHospitalAnalytics(
        Number(req.params.hospitalId)
      );
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch hospital analytics.' });
    }
  }
);

// Add Platform Expense (Central Admin Only)
apiRouter.post(
  '/analytics/platform-expenses',
  requireAuth,
  requireRole('CENTRAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        category: z.string().min(2),
        description: z.string().min(2),
        amount: z.number().min(1),
        recordedDate: z.string(),
      });
      const data = schema.parse(req.body);
      const [exp] = await AnalyticsService.addPlatformExpense({
        ...data,
        recordedBy: req.user!.fullName,
      });
      res.json(exp);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to add platform expense.' });
    }
  }
);

// Add Hospital Expense (Hospital Admin)
apiRouter.post(
  '/analytics/hospital-expenses',
  requireAuth,
  requireRole('HOSPITAL_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        category: z.string().min(2),
        description: z.string().min(2),
        amount: z.number().min(1),
        expenseDate: z.string(),
      });
      const data = schema.parse(req.body);
      const [exp] = await AnalyticsService.addHospitalExpense({
        ...data,
        hospitalId: req.user!.hospitalId!,
      });
      res.json(exp);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to add hospital expense.' });
    }
  }
);

/* ==========================================================================
   10. NOTIFICATIONS, UPDATES & COMMUNICATION
   ========================================================================== */

// Get User Notifications
apiRouter.get('/notifications/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await NotificationService.getUserNotifications(req.user!.id);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark Notification Read
apiRouter.put('/notifications/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await NotificationService.markNotificationRead(
      Number(req.params.id),
      req.user!.id
    );
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update notification.' });
  }
});

// Mark All Read
apiRouter.put('/notifications/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markAllNotificationsRead(req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// Public Hospital Announcements & Updates
apiRouter.get('/updates', async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query;
    const list = await NotificationService.getHospitalUpdates(
      hospitalId ? Number(hospitalId) : undefined
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch hospital updates.' });
  }
});

// Post Hospital Update (Hospital Admin or Central Admin)
apiRouter.post(
  '/updates/hospital/:hospitalId',
  requireAuth,
  requireRole('HOSPITAL_ADMIN', 'CENTRAL_ADMIN'),
  requireHospitalAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        title: z.string().min(3),
        content: z.string().min(5),
        category: z.enum(['ANNOUNCEMENT', 'EMERGENCY', 'BLOOD_DRIVE', 'FACILITY_UPDATE']).optional(),
        isPublic: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const update = await NotificationService.postHospitalUpdate({
        ...data,
        hospitalId: Number(req.params.hospitalId),
        staffUserId: req.user!.id,
      });
      res.json(update);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to post update.' });
    }
  }
);

/* ==========================================================================
   11. PATIENT MESSAGING & SMARTCARE
   ========================================================================== */

// Get Patient Messages (Inquiries and Replies)
apiRouter.get(
  '/messages/patient/me',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const list = await NotificationService.getPatientMessages(req.user!.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch messages.' });
    }
  }
);

// Patient Send Message / Inquiry to Hospital
apiRouter.post(
  '/messages/patient',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        hospitalId: z.number(),
        subject: z.string().min(2, 'Subject must be at least 2 characters'),
        content: z.string().min(3, 'Message content must be at least 3 characters'),
      });
      const data = schema.parse(req.body);
      const msg = await NotificationService.sendPatientInquiry({
        patientUserId: req.user!.id,
        hospitalId: data.hospitalId,
        subject: data.subject,
        content: data.content,
      });
      res.json(msg);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to send inquiry.' });
    }
  }
);

// SmartCare Clinical Triage & Hospital Routing
apiRouter.post('/smartcare/triage', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      symptoms: z.array(z.string()).min(1, 'Please select at least one symptom'),
      description: z.string().optional(),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
      durationDays: z.number().min(1).default(1),
      painScale: z.number().min(1).max(10).default(3),
      age: z.number().optional(),
      preExistingConditions: z.array(z.string()).optional(),
    });
    const data = schema.parse(req.body);
    const result = await SmartCareService.triage(data);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'SmartCare triage assessment failed.' });
  }
});
