import { db } from '../db/index.ts';
import {
  queues,
  queueEvents,
  appointments,
  patientProfiles,
  doctorProfiles,
  departments,
  hospitals,
  users,
  notifications,
  auditLogs,
} from '../db/schema.ts';
import { eq, and, asc } from 'drizzle-orm';

export class QueueService {
  static async getHospitalQueues(hospitalId: number, date?: string) {
    const today = date || new Date().toISOString().split('T')[0];
    const qList = await db
      .select({
        id: queues.id,
        hospitalId: queues.hospitalId,
        departmentId: queues.departmentId,
        departmentName: departments.name,
        doctorId: queues.doctorId,
        date: queues.date,
        currentCallingToken: queues.currentCallingToken,
        totalTokens: queues.totalTokens,
        status: queues.status,
      })
      .from(queues)
      .innerJoin(departments, eq(queues.departmentId, departments.id))
      .where(and(eq(queues.hospitalId, hospitalId), eq(queues.date, today)));

    return qList;
  }

  static async getQueueDetails(queueId: number, hospitalId: number) {
    const [q] = await db
      .select()
      .from(queues)
      .where(and(eq(queues.id, queueId), eq(queues.hospitalId, hospitalId)))
      .limit(1);

    if (!q) throw new Error('Queue not found.');

    const events = await db
      .select({
        id: queueEvents.id,
        tokenNumber: queueEvents.tokenNumber,
        status: queueEvents.status,
        estimatedWaitMinutes: queueEvents.estimatedWaitMinutes,
        calledAt: queueEvents.calledAt,
        completedAt: queueEvents.completedAt,
        appointmentId: queueEvents.appointmentId,
        patientId: queueEvents.patientId,
        patientName: users.fullName,
        patientPhone: users.phone,
      })
      .from(queueEvents)
      .innerJoin(patientProfiles, eq(queueEvents.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .where(eq(queueEvents.queueId, queueId))
      .orderBy(asc(queueEvents.tokenNumber));

    return {
      queue: q,
      events,
    };
  }

  static async callNextToken(queueId: number, hospitalId: number, staffUserId: number) {
    const [q] = await db
      .select()
      .from(queues)
      .where(and(eq(queues.id, queueId), eq(queues.hospitalId, hospitalId)))
      .limit(1);

    if (!q) throw new Error('Queue not found.');

    // Find next waiting event
    const [nextEvent] = await db
      .select()
      .from(queueEvents)
      .where(and(eq(queueEvents.queueId, queueId), eq(queueEvents.status, 'WAITING')))
      .orderBy(asc(queueEvents.tokenNumber))
      .limit(1);

    if (!nextEvent) {
      throw new Error('No waiting patients in this queue.');
    }

    // Update queue event
    await db
      .update(queueEvents)
      .set({
        status: 'CALLED',
        calledAt: new Date(),
      })
      .where(eq(queueEvents.id, nextEvent.id));

    // Update queue current token
    const [updatedQueue] = await db
      .update(queues)
      .set({
        currentCallingToken: nextEvent.tokenNumber,
      })
      .where(eq(queues.id, queueId))
      .returning();

    // Get patient user for notification
    const [patient] = await db
      .select({ userId: patientProfiles.userId })
      .from(patientProfiles)
      .where(eq(patientProfiles.id, nextEvent.patientId))
      .limit(1);

    if (patient) {
      await db.insert(notifications).values({
        userId: patient.userId,
        hospitalId,
        title: 'Token Called!',
        message: `Your token #${nextEvent.tokenNumber} is now being called to the consultation room.`,
        type: 'QUEUE_ALERT',
      });
    }

    await db.insert(auditLogs).values({
      hospitalId,
      userId: staffUserId,
      action: 'CALL_QUEUE_TOKEN',
      resource: 'queues',
      details: `Called Token #${nextEvent.tokenNumber} in Queue ${queueId}`,
    });

    return {
      queue: updatedQueue,
      calledToken: nextEvent.tokenNumber,
      eventId: nextEvent.id,
    };
  }

  static async updateEventStatus(
    eventId: number,
    status: 'WAITING' | 'CALLED' | 'IN_ROOM' | 'COMPLETED' | 'MISSED',
    hospitalId: number,
    staffUserId: number
  ) {
    const [event] = await db
      .select()
      .from(queueEvents)
      .where(eq(queueEvents.id, eventId))
      .limit(1);

    if (!event) throw new Error('Queue event not found.');

    const [updated] = await db
      .update(queueEvents)
      .set({
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      })
      .where(eq(queueEvents.id, eventId))
      .returning();

    // If event is linked to appointment, sync status
    if (event.appointmentId) {
      const aptStatus =
        status === 'IN_ROOM'
          ? 'IN_CONSULTATION'
          : status === 'COMPLETED'
            ? 'COMPLETED'
            : status === 'MISSED'
              ? 'CANCELLED'
              : 'CHECKED_IN';

      await db
        .update(appointments)
        .set({ status: aptStatus })
        .where(eq(appointments.id, event.appointmentId));
    }

    await db.insert(auditLogs).values({
      hospitalId,
      userId: staffUserId,
      action: 'UPDATE_QUEUE_EVENT',
      resource: 'queue_events',
      details: `Token #${event.tokenNumber} changed to ${status}`,
    });

    return updated;
  }

  static async getLiveQueueByAppointmentRef(bookingReference: string) {
    const [apt] = await db
      .select({
        id: appointments.id,
        bookingReference: appointments.bookingReference,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        hospitalName: hospitals.name,
        departmentName: departments.name,
        doctorName: users.fullName,
      })
      .from(appointments)
      .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .innerJoin(departments, eq(appointments.departmentId, departments.id))
      .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(appointments.bookingReference, bookingReference.trim().toUpperCase()))
      .limit(1);

    if (!apt) throw new Error('Booking reference not found.');

    const [qEvent] = await db
      .select()
      .from(queueEvents)
      .where(eq(queueEvents.appointmentId, apt.id))
      .limit(1);

    let queueInfo = null;
    if (qEvent) {
      const [q] = await db.select().from(queues).where(eq(queues.id, qEvent.queueId)).limit(1);
      if (q) {
        queueInfo = {
          currentCallingToken: q.currentCallingToken,
          totalTokens: q.totalTokens,
          status: q.status,
          userToken: qEvent.tokenNumber,
          userStatus: qEvent.status,
          estimatedWaitMinutes: Math.max(0, (qEvent.tokenNumber - q.currentCallingToken) * 12),
        };
      }
    }

    return {
      appointment: apt,
      queue: queueInfo,
    };
  }
}
