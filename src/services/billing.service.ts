import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  bills,
  billItems,
  payments,
  refunds,
  patientProfiles,
  hospitals,
  users,
  patientInsurances,
  hospitalInsurances,
  insuranceProviders,
  auditLogs,
  notifications,
} from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export class BillingService {
  static async getHospitalBills(hospitalId: number, status?: string) {
    const conditions = [eq(bills.hospitalId, hospitalId)];
    if (status) {
      conditions.push(eq(bills.status, status));
    }

    const list = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        hospitalId: bills.hospitalId,
        patientId: bills.patientId,
        patientName: users.fullName,
        patientPhone: users.phone,
        totalAmount: bills.totalAmount,
        insuranceDiscount: bills.insuranceDiscount,
        netPayable: bills.netPayable,
        paidAmount: bills.paidAmount,
        status: bills.status,
        dueDate: bills.dueDate,
        createdAt: bills.createdAt,
      })
      .from(bills)
      .innerJoin(patientProfiles, eq(bills.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(bills.createdAt));

    return list;
  }

  static async getBillDetails(billId: number, hospitalId?: number) {
    const conditions = [eq(bills.id, billId)];
    if (hospitalId) {
      conditions.push(eq(bills.hospitalId, hospitalId));
    }

    const [bill] = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        hospitalId: bills.hospitalId,
        hospitalName: hospitals.name,
        hospitalAddress: hospitals.address,
        hospitalPhone: hospitals.phone,
        patientId: bills.patientId,
        patientName: users.fullName,
        patientEmail: users.email,
        patientPhone: users.phone,
        totalAmount: bills.totalAmount,
        insuranceDiscount: bills.insuranceDiscount,
        netPayable: bills.netPayable,
        paidAmount: bills.paidAmount,
        status: bills.status,
        dueDate: bills.dueDate,
        createdAt: bills.createdAt,
      })
      .from(bills)
      .innerJoin(hospitals, eq(bills.hospitalId, hospitals.id))
      .innerJoin(patientProfiles, eq(bills.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!bill) throw new Error('Bill not found.');

    const items = await db
      .select()
      .from(billItems)
      .where(eq(billItems.billId, billId));

    const billPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.billId, billId))
      .orderBy(desc(payments.paidAt));

    const billRefunds = await db
      .select()
      .from(refunds)
      .where(eq(refunds.billId, billId))
      .orderBy(desc(refunds.processedAt));

    return {
      bill,
      items,
      payments: billPayments,
      refunds: billRefunds,
    };
  }

  static async addBillItem(
    billId: number,
    data: { description: string; unitPrice: number; quantity: number },
    hospitalId: number,
    staffUserId: number
  ) {
    const [bill] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, billId), eq(bills.hospitalId, hospitalId)))
      .limit(1);

    if (!bill) throw new Error('Bill not found in your hospital.');

    const totalPrice = data.unitPrice * (data.quantity || 1);

    await db.insert(billItems).values({
      billId,
      description: data.description,
      unitPrice: data.unitPrice,
      quantity: data.quantity || 1,
      totalPrice,
    });

    const newTotal = bill.totalAmount + totalPrice;
    const newNet = Math.max(0, newTotal - bill.insuranceDiscount);
    const newStatus = bill.paidAmount >= newNet ? 'PAID' : bill.paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING';

    const [updated] = await db
      .update(bills)
      .set({
        totalAmount: newTotal,
        netPayable: newNet,
        status: newStatus,
      })
      .where(eq(bills.id, billId))
      .returning();

    await db.insert(auditLogs).values({
      hospitalId,
      userId: staffUserId,
      action: 'ADD_BILL_ITEM',
      resource: 'bills',
      details: `Added item "${data.description}" for $${totalPrice} to Bill ${bill.billNumber}`,
    });

    return updated;
  }

  static async applyInsuranceClaim(
    billId: number,
    patientInsuranceId: number,
    hospitalId: number,
    staffUserId: number
  ) {
    const [bill] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, billId), eq(bills.hospitalId, hospitalId)))
      .limit(1);

    if (!bill) throw new Error('Bill not found in your hospital.');

    // Fetch patient insurance details
    const [pIns] = await db
      .select({
        providerId: patientInsurances.providerId,
        coverageAmount: patientInsurances.coverageAmount,
        providerName: insuranceProviders.name,
      })
      .from(patientInsurances)
      .innerJoin(insuranceProviders, eq(patientInsurances.providerId, insuranceProviders.id))
      .where(eq(patientInsurances.id, patientInsuranceId))
      .limit(1);

    if (!pIns) throw new Error('Patient insurance record not found.');

    // Check if hospital accepts this provider
    const [hIns] = await db
      .select()
      .from(hospitalInsurances)
      .where(
        and(
          eq(hospitalInsurances.hospitalId, hospitalId),
          eq(hospitalInsurances.providerId, pIns.providerId)
        )
      )
      .limit(1);

    if (!hIns) {
      throw new Error(`Hospital does not currently accept ${pIns.providerName}.`);
    }

    // Calculate covered amount according to copay percentage
    const copayPct = hIns.copayPercentage || 10;
    const coveredAmount = Math.round(bill.totalAmount * ((100 - copayPct) / 100));
    const netPayable = Math.max(0, bill.totalAmount - coveredAmount);
    const newStatus = bill.paidAmount >= netPayable ? 'PAID' : bill.paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING';

    const [updated] = await db
      .update(bills)
      .set({
        insuranceDiscount: coveredAmount,
        netPayable,
        status: newStatus,
      })
      .where(eq(bills.id, billId))
      .returning();

    await db.insert(auditLogs).values({
      hospitalId,
      userId: staffUserId,
      action: 'APPLY_INSURANCE_CLAIM',
      resource: 'bills',
      details: `Applied ${pIns.providerName} claim: Covered $${coveredAmount}, Net Payable $${netPayable}`,
    });

    return updated;
  }

  static async recordPayment(data: {
    billId: number;
    amount: number;
    paymentMethod: string;
    hospitalId: number;
    patientUserId?: number;
    staffUserId?: number;
  }) {
    const [bill] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, data.billId), eq(bills.hospitalId, data.hospitalId)))
      .limit(1);

    if (!bill) throw new Error('Bill not found.');

    const txnId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const [payment] = await db
      .insert(payments)
      .values({
        transactionId: txnId,
        billId: data.billId,
        hospitalId: data.hospitalId,
        patientId: bill.patientId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'SUCCESS',
      })
      .returning();

    const newPaidAmount = bill.paidAmount + data.amount;
    const newStatus = newPaidAmount >= bill.netPayable ? 'PAID' : 'PARTIALLY_PAID';

    await db
      .update(bills)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
      })
      .where(eq(bills.id, data.billId));

    // Notify patient
    const [patient] = await db
      .select({ userId: patientProfiles.userId })
      .from(patientProfiles)
      .where(eq(patientProfiles.id, bill.patientId))
      .limit(1);

    if (patient) {
      await db.insert(notifications).values({
        userId: patient.userId,
        hospitalId: data.hospitalId,
        title: 'Payment Successful',
        message: `Payment of $${data.amount} for Bill ${bill.billNumber} was successful. Transaction ID: ${txnId}.`,
        type: 'BILLING',
      });
    }

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.staffUserId || patient?.userId,
      action: 'RECORD_PAYMENT',
      resource: 'payments',
      details: `Payment of $${data.amount} recorded for Bill ${bill.billNumber}. Method: ${data.paymentMethod}`,
    });

    return payment;
  }

  static async processRefund(data: {
    paymentId: number;
    billId: number;
    hospitalId: number;
    amount: number;
    reason: string;
    staffUserId: number;
  }) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, data.paymentId), eq(payments.hospitalId, data.hospitalId)))
      .limit(1);

    if (!payment) throw new Error('Payment not found.');

    const [bill] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, data.billId), eq(bills.hospitalId, data.hospitalId)))
      .limit(1);

    if (!bill) throw new Error('Bill not found.');

    const refundNum = `REF-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const [refund] = await db
      .insert(refunds)
      .values({
        refundNumber: refundNum,
        paymentId: data.paymentId,
        billId: data.billId,
        hospitalId: data.hospitalId,
        amount: data.amount,
        reason: data.reason,
        status: 'COMPLETED',
      })
      .returning();

    const updatedPaid = Math.max(0, bill.paidAmount - data.amount);
    const newStatus = updatedPaid === 0 ? 'REFUNDED' : updatedPaid < bill.netPayable ? 'PARTIALLY_PAID' : 'PAID';

    await db
      .update(bills)
      .set({
        paidAmount: updatedPaid,
        status: newStatus,
      })
      .where(eq(bills.id, data.billId));

    await db.insert(auditLogs).values({
      hospitalId: data.hospitalId,
      userId: data.staffUserId,
      action: 'PROCESS_REFUND',
      resource: 'refunds',
      details: `Refund of $${data.amount} processed for Bill ${bill.billNumber}. Ref: ${refundNum}`,
    });

    return refund;
  }

  static async getPatientBills(patientUserId: number) {
    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientUserId))
      .limit(1);

    if (!patient) return [];

    const list = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        hospitalId: bills.hospitalId,
        hospitalName: hospitals.name,
        totalAmount: bills.totalAmount,
        insuranceDiscount: bills.insuranceDiscount,
        netPayable: bills.netPayable,
        paidAmount: bills.paidAmount,
        status: bills.status,
        dueDate: bills.dueDate,
        createdAt: bills.createdAt,
      })
      .from(bills)
      .innerJoin(hospitals, eq(bills.hospitalId, hospitals.id))
      .where(eq(bills.patientId, patient.id))
      .orderBy(desc(bills.createdAt));

    return list;
  }
}
