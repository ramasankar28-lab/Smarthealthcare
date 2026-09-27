import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Hospitals
export const hospitals = pgTable('hospitals', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // H001, H002, etc.
  name: text('name').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  emergencyAvailable: boolean('emergency_available').default(true).notNull(),
  totalBeds: integer('total_beds').default(100).notNull(),
  availableBeds: integer('available_beds').default(24).notNull(),
  rating: text('rating').default('4.8').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'CENTRAL_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'BILLING' | 'PATIENT'
  hospitalId: integer('hospital_id').references(() => hospitals.id),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  otpSecret: text('otp_secret'),
  otpExpiresAt: timestamp('otp_expires_at'),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'SUSPENDED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Departments
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  headDoctorName: text('head_doctor_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Doctor Profiles
export const doctorProfiles = pgTable('doctor_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  departmentId: integer('department_id')
    .references(() => departments.id)
    .notNull(),
  specialty: text('specialty').notNull(),
  qualification: text('qualification').notNull(),
  experienceYears: integer('experience_years').default(5).notNull(),
  consultationFee: integer('consultation_fee').default(50).notNull(),
  roomNumber: text('room_number'),
  bio: text('bio'),
  isAvailable: boolean('is_available').default(true).notNull(),
});

// 5. Nurse Profiles
export const nurseProfiles = pgTable('nurse_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  shift: text('shift').default('MORNING').notNull(), // 'MORNING' | 'EVENING' | 'NIGHT'
  station: text('station'),
});

// 6. Receptionist Profiles
export const receptionistProfiles = pgTable('receptionist_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  deskNumber: text('desk_number'),
});

// 7. Billing Profiles
export const billingProfiles = pgTable('billing_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  counterNumber: text('counter_number'),
});

// 8. Patient Profiles
export const patientProfiles = pgTable('patient_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  dob: text('dob'),
  gender: text('gender'), // 'MALE' | 'FEMALE' | 'OTHER'
  address: text('address'),
  bloodGroup: text('blood_group'),
  emergencyContact: text('emergency_contact'),
  allergies: text('allergies'),
});

// 9. Appointment Slots
export const appointmentSlots = pgTable('appointment_slots', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(), // HH:MM
  maxPatients: integer('max_patients').default(1).notNull(),
  bookedCount: integer('booked_count').default(0).notNull(),
  status: text('status').default('AVAILABLE').notNull(), // 'AVAILABLE' | 'FULL' | 'CANCELLED'
});

// 10. Appointments
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  bookingReference: text('booking_reference').notNull().unique(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  departmentId: integer('department_id')
    .references(() => departments.id)
    .notNull(),
  slotId: integer('slot_id').references(() => appointmentSlots.id),
  appointmentDate: text('appointment_date').notNull(),
  appointmentTime: text('appointment_time').notNull(),
  reason: text('reason'),
  status: text('status').default('CONFIRMED').notNull(), // 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Queues
export const queues = pgTable('queues', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  departmentId: integer('department_id')
    .references(() => departments.id)
    .notNull(),
  doctorId: integer('doctor_id').references(() => doctorProfiles.id),
  date: text('date').notNull(), // YYYY-MM-DD
  currentCallingToken: integer('current_calling_token').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'PAUSED' | 'CLOSED'
});

// 12. Queue Events
export const queueEvents = pgTable('queue_events', {
  id: serial('id').primaryKey(),
  queueId: integer('queue_id')
    .references(() => queues.id)
    .notNull(),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  tokenNumber: integer('token_number').notNull(),
  status: text('status').default('WAITING').notNull(), // 'WAITING' | 'CALLED' | 'IN_ROOM' | 'COMPLETED' | 'MISSED'
  estimatedWaitMinutes: integer('estimated_wait_minutes').default(15).notNull(),
  calledAt: timestamp('called_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Consultations
export const consultations = pgTable('consultations', {
  id: serial('id').primaryKey(),
  appointmentId: integer('appointment_id')
    .references(() => appointments.id)
    .notNull(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  chiefComplaint: text('chief_complaint'),
  diagnosis: text('diagnosis'),
  clinicalNotes: text('clinical_notes'),
  followUpDate: text('follow_up_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Medical Records
export const medicalRecords = pgTable('medical_records', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  doctorId: integer('doctor_id').references(() => doctorProfiles.id),
  recordType: text('record_type').notNull(), // 'LAB_REPORT' | 'IMAGING' | 'DISCHARGE_SUMMARY' | 'CLINICAL_NOTE' | 'VACCINATION'
  title: text('title').notNull(),
  details: text('details'),
  fileUrl: text('file_url'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// 15. Vitals
export const vitals = pgTable('vitals', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  recordedByNurseId: integer('recorded_by_nurse_id').references(
    () => nurseProfiles.id
  ),
  bloodPressure: text('blood_pressure'),
  heartRate: integer('heart_rate'),
  temperature: text('temperature'),
  respiratoryRate: integer('respiratory_rate'),
  oxygenSaturation: integer('oxygen_saturation'),
  weightKg: text('weight_kg'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// 16. Prescriptions
export const prescriptions = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id')
    .references(() => consultations.id)
    .notNull(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  durationDays: integer('duration_days').notNull(),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. Bills
export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  billNumber: text('bill_number').notNull().unique(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  totalAmount: integer('total_amount').notNull(),
  insuranceDiscount: integer('insurance_discount').default(0).notNull(),
  netPayable: integer('net_payable').notNull(),
  paidAmount: integer('paid_amount').default(0).notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED'
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. Bill Items
export const billItems = pgTable('bill_items', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id')
    .references(() => bills.id)
    .notNull(),
  description: text('description').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  totalPrice: integer('total_price').notNull(),
});

// 19. Payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  transactionId: text('transaction_id').notNull().unique(),
  billId: integer('bill_id')
    .references(() => bills.id)
    .notNull(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH' | 'INSURANCE_DIRECT'
  status: text('status').default('SUCCESS').notNull(), // 'SUCCESS' | 'FAILED' | 'PENDING'
  paidAt: timestamp('paid_at').defaultNow().notNull(),
});

// 20. Refunds
export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  refundNumber: text('refund_number').notNull().unique(),
  paymentId: integer('payment_id')
    .references(() => payments.id)
    .notNull(),
  billId: integer('bill_id')
    .references(() => bills.id)
    .notNull(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('COMPLETED').notNull(), // 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  processedAt: timestamp('processed_at').defaultNow().notNull(),
});

// 21. Insurance Providers
export const insuranceProviders = pgTable('insurance_providers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  coverageType: text('coverage_type').notNull(),
  supportContact: text('support_contact'),
  isActive: boolean('is_active').default(true).notNull(),
});

// 22. Hospital Insurances
export const hospitalInsurances = pgTable('hospital_insurances', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  providerId: integer('provider_id')
    .references(() => insuranceProviders.id)
    .notNull(),
  isCashlessSupported: boolean('is_cashless_supported').default(true).notNull(),
  copayPercentage: integer('copay_percentage').default(10).notNull(),
});

// 23. Patient Insurances
export const patientInsurances = pgTable('patient_insurances', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  providerId: integer('provider_id')
    .references(() => insuranceProviders.id)
    .notNull(),
  policyNumber: text('policy_number').notNull(),
  validUntil: text('valid_until').notNull(),
  coverageAmount: integer('coverage_amount').notNull(),
  status: text('status').default('VERIFIED').notNull(), // 'PENDING' | 'VERIFIED' | 'EXPIRED'
});

// 24. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  hospitalId: integer('hospital_id').references(() => hospitals.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('INFO').notNull(), // 'INFO' | 'QUEUE_ALERT' | 'APPOINTMENT' | 'BILLING' | 'EMERGENCY'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 25. Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  senderUserId: integer('sender_user_id')
    .references(() => users.id)
    .notNull(),
  recipientUserId: integer('recipient_user_id').references(() => users.id),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// 26. Hospital Updates
export const hospitalUpdates = pgTable('hospital_updates', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('ANNOUNCEMENT').notNull(), // 'ANNOUNCEMENT' | 'EMERGENCY' | 'BLOOD_DRIVE' | 'FACILITY_UPDATE'
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 27. Reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  patientId: integer('patient_id')
    .references(() => patientProfiles.id)
    .notNull(),
  doctorId: integer('doctor_id').references(() => doctorProfiles.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 28. Doctor Availabilities
export const doctorAvailabilities = pgTable('doctor_availabilities', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(), // HH:MM
  isAvailable: boolean('is_available').default(true).notNull(),
});

// 29. Staff Assignments
export const staffAssignments = pgTable('staff_assignments', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  shiftName: text('shift_name'),
  effectiveFrom: text('effective_from'),
  status: text('status').default('ACTIVE').notNull(),
});

// 30. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id').references(() => hospitals.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 31. Expenses: Platform & Hospital
export const platformExpenses = pgTable('platform_expenses', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  recordedDate: text('recorded_date').notNull(),
  recordedBy: text('recorded_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hospitalExpenses = pgTable('hospital_expenses', {
  id: serial('id').primaryKey(),
  hospitalId: integer('hospital_id')
    .references(() => hospitals.id)
    .notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  expenseDate: text('expense_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  departments: many(departments),
  doctorProfiles: many(doctorProfiles),
  nurseProfiles: many(nurseProfiles),
  receptionistProfiles: many(receptionistProfiles),
  billingProfiles: many(billingProfiles),
  appointments: many(appointments),
  queues: many(queues),
  bills: many(bills),
  hospitalInsurances: many(hospitalInsurances),
  hospitalUpdates: many(hospitalUpdates),
  reviews: many(reviews),
  hospitalExpenses: many(hospitalExpenses),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [users.hospitalId],
    references: [hospitals.id],
  }),
  doctorProfile: one(doctorProfiles, {
    fields: [users.id],
    references: [doctorProfiles.userId],
  }),
  patientProfile: one(patientProfiles, {
    fields: [users.id],
    references: [patientProfiles.userId],
  }),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [departments.hospitalId],
    references: [hospitals.id],
  }),
  doctorProfiles: many(doctorProfiles),
}));

export const doctorProfilesRelations = relations(
  doctorProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [doctorProfiles.userId],
      references: [users.id],
    }),
    hospital: one(hospitals, {
      fields: [doctorProfiles.hospitalId],
      references: [hospitals.id],
    }),
    department: one(departments, {
      fields: [doctorProfiles.departmentId],
      references: [departments.id],
    }),
    appointmentSlots: many(appointmentSlots),
    appointments: many(appointments),
    consultations: many(consultations),
    availabilities: many(doctorAvailabilities),
  })
);

export const patientProfilesRelations = relations(
  patientProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [patientProfiles.userId],
      references: [users.id],
    }),
    appointments: many(appointments),
    consultations: many(consultations),
    medicalRecords: many(medicalRecords),
    vitals: many(vitals),
    bills: many(bills),
    insurances: many(patientInsurances),
  })
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [appointments.hospitalId],
    references: [hospitals.id],
  }),
  patient: one(patientProfiles, {
    fields: [appointments.patientId],
    references: [patientProfiles.id],
  }),
  doctor: one(doctorProfiles, {
    fields: [appointments.doctorId],
    references: [doctorProfiles.id],
  }),
  department: one(departments, {
    fields: [appointments.departmentId],
    references: [departments.id],
  }),
  slot: one(appointmentSlots, {
    fields: [appointments.slotId],
    references: [appointmentSlots.id],
  }),
}));

export const queuesRelations = relations(queues, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [queues.hospitalId],
    references: [hospitals.id],
  }),
  department: one(departments, {
    fields: [queues.departmentId],
    references: [departments.id],
  }),
  doctor: one(doctorProfiles, {
    fields: [queues.doctorId],
    references: [doctorProfiles.id],
  }),
  events: many(queueEvents),
}));

export const queueEventsRelations = relations(queueEvents, ({ one }) => ({
  queue: one(queues, {
    fields: [queueEvents.queueId],
    references: [queues.id],
  }),
  appointment: one(appointments, {
    fields: [queueEvents.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patientProfiles, {
    fields: [queueEvents.patientId],
    references: [patientProfiles.id],
  }),
}));

export const consultationsRelations = relations(
  consultations,
  ({ one, many }) => ({
    appointment: one(appointments, {
      fields: [consultations.appointmentId],
      references: [appointments.id],
    }),
    doctor: one(doctorProfiles, {
      fields: [consultations.doctorId],
      references: [doctorProfiles.id],
    }),
    patient: one(patientProfiles, {
      fields: [consultations.patientId],
      references: [patientProfiles.id],
    }),
    prescriptions: many(prescriptions),
  })
);

export const billsRelations = relations(bills, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [bills.hospitalId],
    references: [hospitals.id],
  }),
  patient: one(patientProfiles, {
    fields: [bills.patientId],
    references: [patientProfiles.id],
  }),
  appointment: one(appointments, {
    fields: [bills.appointmentId],
    references: [appointments.id],
  }),
  items: many(billItems),
  payments: many(payments),
}));
