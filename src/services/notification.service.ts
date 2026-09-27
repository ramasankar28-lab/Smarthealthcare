import { db } from '../db/index.ts';
import {
  notifications,
  messages,
  hospitalUpdates,
  users,
  hospitals,
  auditLogs,
} from '../db/schema.ts';
import { eq, desc, and, or } from 'drizzle-orm';

export class NotificationService {
  static async getUserNotifications(userId: number) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  static async markNotificationRead(id: number, userId: number) {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
  }

  static async markAllNotificationsRead(userId: number) {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  static async getHospitalUpdates(hospitalId?: number) {
    if (hospitalId) {
      return await db
        .select()
        .from(hospitalUpdates)
        .where(eq(hospitalUpdates.hospitalId, hospitalId))
        .orderBy(desc(hospitalUpdates.createdAt));
    }
    return await db
      .select({
        id: hospitalUpdates.id,
        hospitalId: hospitalUpdates.hospitalId,
        hospitalName: hospitals.name,
        title: hospitalUpdates.title,
        content: hospitalUpdates.content,
        category: hospitalUpdates.category,
        isPublic: hospitalUpdates.isPublic,
        createdAt: hospitalUpdates.createdAt,
      })
      .from(hospitalUpdates)
      .innerJoin(hospitals, eq(hospitalUpdates.hospitalId, hospitals.id))
      .where(eq(hospitalUpdates.isPublic, true))
      .orderBy(desc(hospitalUpdates.createdAt))
      .limit(10);
  }

  static async postHospitalUpdate(data: {
    hospitalId: number;
    title: string;
    content: string;
    category?: string;
    isPublic?: boolean;
    staffUserId: number;
  }) {
    const [update] = await db
      .insert(hospitalUpdates)
      .values({
        hospitalId: data.hospitalId,
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category || 'ANNOUNCEMENT',
        isPublic: data.isPublic ?? true,
      })
      .returning();

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.staffUserId,
      action: 'POST_HOSPITAL_UPDATE',
      resource: 'hospital_updates',
      details: `Posted update: "${data.title}" (${data.category})`,
    });

    return update;
  }

  static async getMessages(userId: number, hospitalId?: number) {
    const conditions = [];
    if (hospitalId) {
      conditions.push(eq(messages.hospitalId, hospitalId));
    }

    return await db
      .select({
        id: messages.id,
        hospitalId: messages.hospitalId,
        senderUserId: messages.senderUserId,
        recipientUserId: messages.recipientUserId,
        subject: messages.subject,
        content: messages.content,
        sentAt: messages.sentAt,
      })
      .from(messages)
      .where(and(eq(messages.recipientUserId, userId), ...conditions))
      .orderBy(desc(messages.sentAt));
  }

  static async sendMessage(data: {
    hospitalId: number;
    senderUserId: number;
    recipientUserId: number;
    subject: string;
    content: string;
  }) {
    const [msg] = await db.insert(messages).values(data).returning();

    // Also trigger notification
    await db.insert(notifications).values({
      userId: data.recipientUserId,
      hospitalId: data.hospitalId,
      title: `New Message: ${data.subject}`,
      message: data.content.slice(0, 120),
      type: 'INFO',
    });

    return msg;
  }

  static async getPatientMessages(userId: number) {
    const list = await db
      .select({
        id: messages.id,
        hospitalId: messages.hospitalId,
        hospitalName: hospitals.name,
        senderUserId: messages.senderUserId,
        recipientUserId: messages.recipientUserId,
        subject: messages.subject,
        content: messages.content,
        sentAt: messages.sentAt,
      })
      .from(messages)
      .innerJoin(hospitals, eq(messages.hospitalId, hospitals.id))
      .where(or(eq(messages.senderUserId, userId), eq(messages.recipientUserId, userId)))
      .orderBy(desc(messages.sentAt));

    return list;
  }

  static async sendPatientInquiry(data: {
    patientUserId: number;
    hospitalId: number;
    subject: string;
    content: string;
  }) {
    // Find active staff/admin at this hospital
    const [hospitalStaff] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.hospitalId, data.hospitalId), eq(users.status, 'ACTIVE')))
      .limit(1);

    const [msg] = await db
      .insert(messages)
      .values({
        hospitalId: data.hospitalId,
        senderUserId: data.patientUserId,
        recipientUserId: hospitalStaff?.id || null,
        subject: data.subject.trim(),
        content: data.content.trim(),
      })
      .returning();

    // Notify hospital staff if available
    if (hospitalStaff) {
      await db.insert(notifications).values({
        userId: hospitalStaff.id,
        hospitalId: data.hospitalId,
        title: `Patient Inquiry: ${data.subject}`,
        message: data.content.slice(0, 140),
        type: 'INQUIRY',
      });
    }

    return msg;
  }
}
