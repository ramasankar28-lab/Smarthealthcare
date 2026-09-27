import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  appointments,
  appointmentSlots,
  hospitals,
  doctorProfiles,
  patientProfiles,
  departments,
  users,
  queues,
  queueEvents,
  bills,
  billItems,
  notifications,
  auditLogs,
} from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export class AppointmentService {
  static async getDoctorSlots(doctorId: number, date: string) {
    const slots = await db
      .select()
      .from(appointmentSlots)
      .where(and(eq(appointmentSlots.doctorId, doctorId), eq(appointmentSlots.date, date)))
      .orderBy(appointmentSlots.startTime);

    return slots;
  }

  static async bookAppointment(data: {
    hospitalId: number;
    patientUserId: number;
    doctorId: number;
    departmentId: number;
    slotId?: number;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
  }) {
    // Find patient profile
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, data.patientUserId))
      .limit(1);

    if (!patient) {
      throw new Error('Patient profile not found. Please complete your patient profile.');
    }

    // Verify doctor
    const [doctor] = await db
      .select({
        id: doctorProfiles.id,
        hospitalId: doctorProfiles.hospitalId,
        departmentId: doctorProfiles.departmentId,
        fee: doctorProfiles.consultationFee,
        fullName: users.fullName,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(doctorProfiles.id, data.doctorId))
      .limit(1);

    if (!doctor) {
      throw new Error('Selected doctor not found.');
    }

    if (doctor.hospitalId !== data.hospitalId) {
      throw new Error('Doctor does not belong to the selected hospital.');
    }

    const bookingRef = `APT-${data.appointmentDate.replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create appointment
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        bookingReference: bookingRef,
        hospitalId: data.hospitalId,
        patientId: patient.id,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        slotId: data.slotId || null,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        reason: data.reason || 'General Consultation',
        status: 'CONFIRMED',
      })
      .returning();

    // If slotId provided, update bookedCount
    if (data.slotId) {
      const [slot] = await db
        .select()
        .from(appointmentSlots)
        .where(eq(appointmentSlots.id, data.slotId))
        .limit(1);

      if (slot) {
        const nextCount = slot.bookedCount + 1;
        await db
          .update(appointmentSlots)
          .set({
            bookedCount: nextCount,
            status: nextCount >= slot.maxPatients ? 'FULL' : 'AVAILABLE',
          })
          .where(eq(appointmentSlots.id, data.slotId));
      }
    }

    // Create Initial Consultation Bill
    const billNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const fee = doctor.fee || 50;

    const [newBill] = await db
      .insert(bills)
      .values({
        billNumber: billNum,
        hospitalId: data.hospitalId,
        patientId: patient.id,
        appointmentId: newAppointment.id,
        totalAmount: fee,
        insuranceDiscount: 0,
        netPayable: fee,
        paidAmount: 0,
        status: 'PENDING',
        dueDate: data.appointmentDate,
      })
      .returning();

    await db.insert(billItems).values({
      billId: newBill.id,
      description: `Consultation Fee - Dr. ${doctor.fullName}`,
      unitPrice: fee,
      quantity: 1,
      totalPrice: fee,
    });

    // Automatically check or create Queue for doctor/department on this date
    let [activeQueue] = await db
      .select()
      .from(queues)
      .where(
        and(
          eq(queues.hospitalId, data.hospitalId),
          eq(queues.departmentId, data.departmentId),
          eq(queues.date, data.appointmentDate)
        )
      )
      .limit(1);

    if (!activeQueue) {
      const [createdQueue] = await db
        .insert(queues)
        .values({
          hospitalId: data.hospitalId,
          departmentId: data.departmentId,
          doctorId: data.doctorId,
          date: data.appointmentDate,
          currentCallingToken: 0,
          totalTokens: 0,
          status: 'ACTIVE',
        })
        .returning();
      activeQueue = createdQueue;
    }

    const nextToken = activeQueue.totalTokens + 1;
    await db
      .update(queues)
      .set({ totalTokens: nextToken })
      .where(eq(queues.id, activeQueue.id));

    const estWait = Math.max(0, (nextToken - activeQueue.currentCallingToken) * 12);
    const [qEvent] = await db
      .insert(queueEvents)
      .values({
        queueId: activeQueue.id,
        appointmentId: newAppointment.id,
        patientId: patient.id,
        tokenNumber: nextToken,
        status: 'WAITING',
        estimatedWaitMinutes: estWait,
      })
      .returning();

    // Patient Notification
    await db.insert(notifications).values({
      userId: data.patientUserId,
      hospitalId: data.hospitalId,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctor.fullName} on ${data.appointmentDate} at ${data.appointmentTime} is confirmed. Queue Token: #${nextToken}. Ref: ${bookingRef}.`,
      type: 'APPOINTMENT',
    });

    // Audit log
    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.patientUserId,
      action: 'BOOK_APPOINTMENT',
      resource: 'appointments',
      details: `Appointment booked ${bookingRef} with Dr. ${doctor.fullName}`,
    });

    return {
      appointment: newAppointment,
      queueToken: nextToken,
      queueEventId: qEvent.id,
      billId: newBill.id,
      bookingReference: bookingRef,
    };
  }

  static async getPatientAppointments(patientUserId: number) {
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientUserId))
      .limit(1);

    if (!patient) return [];

    const list = await db
      .select({
        id: appointments.id,
        bookingReference: appointments.bookingReference,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        notes: appointments.notes,
        hospitalId: appointments.hospitalId,
        hospitalName: hospitals.name,
        hospitalCity: hospitals.city,
        hospitalAddress: hospitals.address,
        hospitalPhone: hospitals.phone,
        departmentName: departments.name,
        doctorName: users.fullName,
        doctorSpecialty: doctorProfiles.specialty,
        roomNumber: doctorProfiles.roomNumber,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .innerJoin(departments, eq(appointments.departmentId, departments.id))
      .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(appointments.patientId, patient.id))
      .orderBy(desc(appointments.appointmentDate));

    // Attach queue events
    const enhanced = await Promise.all(
      list.map(async (apt) => {
        const [qEvent] = await db
          .select({
            tokenNumber: queueEvents.tokenNumber,
            status: queueEvents.status,
            estimatedWaitMinutes: queueEvents.estimatedWaitMinutes,
            queueId: queueEvents.queueId,
          })
          .from(queueEvents)
          .where(eq(queueEvents.appointmentId, apt.id))
          .limit(1);

        let currentCallingToken = 0;
        if (qEvent?.queueId) {
          const [q] = await db
            .select({ currentCallingToken: queues.currentCallingToken })
            .from(queues)
            .where(eq(queues.id, qEvent.queueId))
            .limit(1);
          if (q) currentCallingToken = q.currentCallingToken;
        }

        return {
          ...apt,
          queueInfo: qEvent
            ? {
                tokenNumber: qEvent.tokenNumber,
                status: qEvent.status,
                estimatedWaitMinutes: qEvent.estimatedWaitMinutes,
                currentCallingToken,
              }
            : null,
        };
      })
    );

    return enhanced;
  }

  static async getHospitalAppointments(hospitalId: number, filters?: {
    date?: string;
    departmentId?: number;
    doctorId?: number;
    status?: string;
  }) {
    const conditions = [eq(appointments.hospitalId, hospitalId)];

    if (filters?.date) {
      conditions.push(eq(appointments.appointmentDate, filters.date));
    }
    if (filters?.departmentId) {
      conditions.push(eq(appointments.departmentId, Number(filters.departmentId)));
    }
    if (filters?.doctorId) {
      conditions.push(eq(appointments.doctorId, Number(filters.doctorId)));
    }
    if (filters?.status) {
      conditions.push(eq(appointments.status, filters.status));
    }

    const list = await db
      .select({
        id: appointments.id,
        bookingReference: appointments.bookingReference,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        notes: appointments.notes,
        patientId: appointments.patientId,
        patientName: users.fullName,
        patientPhone: users.phone,
        departmentId: appointments.departmentId,
        departmentName: departments.name,
        doctorId: appointments.doctorId,
        doctorName: users.fullName, // we join doctor user separately
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(patientProfiles, eq(appointments.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .innerJoin(departments, eq(appointments.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(desc(appointments.appointmentDate));

    return list;
  }

  static async updateStatus(
    appointmentId: number,
    status: string,
    hospitalId: number,
    userId: number,
    notes?: string
  ) {
    const [apt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!apt) throw new Error('Appointment not found.');
    if (apt.hospitalId !== hospitalId) {
      throw new Error('Tenant Violation: Cannot update appointment of another hospital.');
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status,
        ...(notes ? { notes } : {}),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // If status is CHECKED_IN or IN_CONSULTATION, update corresponding QueueEvent
    if (['CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].includes(status)) {
      const qStatus =
        status === 'CHECKED_IN'
          ? 'WAITING'
          : status === 'IN_CONSULTATION'
            ? 'IN_ROOM'
            : status === 'COMPLETED'
              ? 'COMPLETED'
              : 'MISSED';

      await db
        .update(queueEvents)
        .set({
          status: qStatus,
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        })
        .where(eq(queueEvents.appointmentId, appointmentId));
    }

    await db.insert(auditLogs).values({
      hospitalId,
      userId,
      action: 'UPDATE_APPOINTMENT_STATUS',
      resource: 'appointments',
      details: `Appointment ${apt.bookingReference} status changed to ${status}`,
    });

    return updated;
  }

  static async patientCancelAppointment(
    appointmentId: number,
    patientUserId: number,
    reason?: string
  ) {
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientUserId))
      .limit(1);

    if (!patient) throw new Error('Patient profile not found.');

    const [apt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!apt) throw new Error('Appointment not found.');
    if (apt.patientId !== patient.id) {
      throw new Error('Unauthorized: You can only cancel your own appointments.');
    }

    if (apt.status === 'CANCELLED') {
      return apt;
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'CANCELLED',
        notes: reason ? `Patient cancelled: ${reason}` : 'Cancelled by patient',
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Mark QueueEvent as MISSED if exists
    await db
      .update(queueEvents)
      .set({ status: 'MISSED' })
      .where(eq(queueEvents.appointmentId, appointmentId));

    // Audit log
    await db.insert(auditLogs).values({
      hospitalId: apt.hospitalId,
      userId: patientUserId,
      action: 'CANCEL_APPOINTMENT',
      resource: 'appointments',
      details: `Appointment ${apt.bookingReference} cancelled by patient. Reason: ${reason || 'N/A'}`,
    });

    return updated;
  }
}
