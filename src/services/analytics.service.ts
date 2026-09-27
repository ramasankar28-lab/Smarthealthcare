import { db } from '../db/index.ts';
import {
  hospitals,
  users,
  appointments,
  bills,
  payments,
  platformExpenses,
  hospitalExpenses,
  queues,
  queueEvents,
  auditLogs,
} from '../db/schema.ts';
import { eq, sql, desc, and } from 'drizzle-orm';

export class AnalyticsService {
  static async getPlatformNetworkOverview() {
    // 1. Hospital counts
    const allHospitals = await db.select().from(hospitals);
    const totalHospitals = allHospitals.length;
    const activeHospitals = allHospitals.filter((h) => h.status === 'ACTIVE').length;

    // 2. Users by role
    const allUsers = await db.select({ role: users.role }).from(users);
    const patientCount = allUsers.filter((u) => u.role === 'PATIENT').length;
    const doctorCount = allUsers.filter((u) => u.role === 'DOCTOR').length;
    const nurseCount = allUsers.filter((u) => u.role === 'NURSE').length;
    const totalStaff = allUsers.filter((u) => u.role !== 'PATIENT' && u.role !== 'CENTRAL_ADMIN').length;

    // 3. Appointments network wide
    const allAppointments = await db.select({ status: appointments.status }).from(appointments);
    const totalAppointments = allAppointments.length;
    const completedAppointments = allAppointments.filter((a) => a.status === 'COMPLETED').length;

    // 4. Financials
    const allPayments = await db.select({ amount: payments.amount }).from(payments);
    const totalGrossRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);

    const expenses = await db.select().from(platformExpenses).orderBy(desc(platformExpenses.recordedDate));
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // 5. Total Bed Capacity
    const totalBeds = allHospitals.reduce((acc, h) => acc + h.totalBeds, 0);
    const availableBeds = allHospitals.reduce((acc, h) => acc + h.availableBeds, 0);

    // 6. Recent Audit Logs
    const recentAuditLogs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        hospitalId: auditLogs.hospitalId,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      networkKPIs: {
        totalHospitals,
        activeHospitals,
        patientCount,
        doctorCount,
        nurseCount,
        totalStaff,
        totalAppointments,
        completedAppointments,
        totalGrossRevenue,
        totalExpenses,
        netSurplus: totalGrossRevenue - totalExpenses,
        totalBeds,
        availableBeds,
        bedOccupancyRate: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
      },
      expenses,
      recentAuditLogs,
    };
  }

  static async getHospitalAnalytics(hospitalId: number) {
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.id, hospitalId))
      .limit(1);

    if (!hospital) throw new Error('Hospital not found.');

    // Appointments in this hospital
    const hospitalApts = await db
      .select({ status: appointments.status })
      .from(appointments)
      .where(eq(appointments.hospitalId, hospitalId));

    const totalAppointments = hospitalApts.length;
    const completed = hospitalApts.filter((a) => a.status === 'COMPLETED').length;
    const confirmed = hospitalApts.filter((a) => a.status === 'CONFIRMED' || a.status === 'CHECKED_IN').length;

    // Financials
    const hospitalPayments = await db
      .select({ amount: payments.amount })
      .from(payments)
      .where(eq(payments.hospitalId, hospitalId));

    const totalCollected = hospitalPayments.reduce((acc, p) => acc + p.amount, 0);

    const hospitalBills = await db
      .select({ netPayable: bills.netPayable, paidAmount: bills.paidAmount })
      .from(bills)
      .where(eq(bills.hospitalId, hospitalId));

    const totalBilled = hospitalBills.reduce((acc, b) => acc + b.netPayable, 0);
    const totalPending = Math.max(0, totalBilled - totalCollected);

    // Expenses
    const expenses = await db
      .select()
      .from(hospitalExpenses)
      .where(eq(hospitalExpenses.hospitalId, hospitalId))
      .orderBy(desc(hospitalExpenses.expenseDate));

    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Queue wait times
    const events = await db
      .select({ estWait: queueEvents.estimatedWaitMinutes, status: queueEvents.status })
      .from(queueEvents)
      .innerJoin(queues, eq(queueEvents.queueId, queues.id))
      .where(eq(queues.hospitalId, hospitalId));

    const avgWaitMinutes =
      events.length > 0
        ? Math.round(events.reduce((acc, e) => acc + e.estWait, 0) / events.length)
        : 12;

    return {
      hospital,
      metrics: {
        totalAppointments,
        completedAppointments: completed,
        activeAppointments: confirmed,
        totalBilled,
        totalCollected,
        totalPending,
        totalExpenseAmount,
        netOperationalMargin: totalCollected - totalExpenseAmount,
        avgWaitMinutes,
        totalBeds: hospital.totalBeds,
        availableBeds: hospital.availableBeds,
        occupiedBeds: hospital.totalBeds - hospital.availableBeds,
        bedOccupancyRate:
          hospital.totalBeds > 0
            ? Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100)
            : 0,
      },
      expenses,
    };
  }

  static async addPlatformExpense(data: {
    category: string;
    description: string;
    amount: number;
    recordedDate: string;
    recordedBy: string;
  }) {
    return await db.insert(platformExpenses).values(data).returning();
  }

  static async addHospitalExpense(data: {
    hospitalId: number;
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
  }) {
    return await db.insert(hospitalExpenses).values(data).returning();
  }
}
