export type AppointmentStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "READY_FOR_DISCHARGE"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type Species = "dog" | "cat" | "rabbit" | "bird" | "reptile" | "other";

export type PatientStatus = "active" | "inactive" | "deceased";

export type UserRole =
  | "CLINIC_OWNER"
  | "CHIEF_VET"
  | "VETERINARIAN"
  | "VETERINARY_TECHNICIAN"
  | "RECEPTIONIST"
  | "PET_OWNER";

export type InventoryStatus = "IN_STOCK" | "RESTOCK_SOON" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryCategory = "Vaccines" | "Surgical Supplies" | "Medication" | "Medical Supplies";

export type PreferredContactMethod = "sms" | "email" | "phone";

export type Sex = "male" | "female";

export type VaccinationStatus = "up_to_date";

export type MedicalRecordType = "EXAM" | "VACCINATION" | "LAB_RESULT";

export type ConversationStatus = "UNREAD" | "READ";

export type ConversationPriority = "NORMAL";

export type MessageSenderType = "OWNER" | "STAFF";

export type NotificationType = "MESSAGE" | "EMERGENCY_CHECK_IN" | "LAB_RESULT" | "SYSTEM" | "APPOINTMENT";

export type NotificationPriority = "NORMAL" | "HIGH" | "LOW";

export type ScheduleItemType = "SURGERY" | "MEETING";

export type HolidayNoticeStatus = "SENT" | "DRAFT";

export interface Address {
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ClinicAddress extends Address {
  line1: string;
}

export interface Clinic {
  id: string;
  name: string;
  legalName: string;
  branch: string;
  address: ClinicAddress;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  status: "active";
  plan: "pro";
}

export interface User {
  id: string;
  clinicId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  displayName: string;
  title: string;
  email: string;
  phone: string;
  licenseNumber: string | null;
  specialty: string | null;
  status: "active";
  avatar: string;
}

export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  address: Address;
  status: "active";
  portalAccess: boolean;
  preferredContactMethod: PreferredContactMethod;
}

export interface Patient {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  neutered: boolean;
  dateOfBirth: string;
  ageYears: number;
  weightKg: number;
  color: string;
  microchipNumber: string | null;
  residence: string;
  status: PatientStatus;
  lastVisit: string;
  nextAppointment: string | null;
  avatar: string;
  allergies: string[];
  conditions: string[];
  notes: string;
  vaccinations: Vaccination[];
}

export interface Vaccination {
  name: string;
  date: string;
  nextDue: string;
  status: VaccinationStatus;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  ownerId: string;
  veterinarianId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  service: string;
  status: AppointmentStatus;
  room: string;
  notes: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  veterinarianId: string;
  appointmentId: string | null;
  date: string;
  type: MedicalRecordType;
  diagnosis: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  weightKg: number;
  temperatureC: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
}

export interface Conversation {
  id: string;
  clinicId: string;
  ownerId: string;
  patientId: string;
  subject: string;
  preview: string;
  lastMessageAt: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  messages: Message[];
}

export interface Message {
  id: string;
  senderType: MessageSenderType;
  senderId: string;
  body: string;
  sentAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  ownerId?: string;
  patientId?: string;
}

export interface InventoryItem {
  id: string;
  clinicId: string;
  name: string;
  category: InventoryCategory;
  sku: string;
  onHand: number;
  reorderLevel: number;
  unit: string;
  status: InventoryStatus;
  supplier: string;
  unitCost: number;
  expirationDate: string | null;
  /** Missing on the original JSON rows; those rows are treated as active. */
  isActive?: boolean;
}

export type InventoryMovementType = "IN" | "OUT";

export interface InventoryMovement {
  id: string;
  itemId: string;
  productName: string;
  unit: string;
  type: InventoryMovementType;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  reason: string;
  createdAt: string;
}

export interface DashboardMetrics {
  activePatients: number;
  totalClients: number;
  today: {
    date: string;
    appointments: number;
    revenue: number;
    urgentCases: number;
    checkedIn: number;
  };
  patientQueue: {
    inSurgery: number;
    recovery: number;
    all: number;
  };
  patientDemographics: {
    canine: number;
    feline: number;
    other: number;
  };
  clinicActivity: { day: string; appointments: number }[];
}

export interface ReportsMetrics {
  period: string;
  appointmentsOverview: {
    totalAppointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    scheduled: number;
  };
  serviceBreakdown: { service: string; percentage: number }[];
  clinicHighlights: {
    patientSatisfaction: number;
    averageWaitTimeMinutes: number;
    appointmentCompletionRate: number;
    returningClientsRate: number;
  };
  weeklyAppointments: { week: string; appointments: number }[];
}

export interface ScheduleItem {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  type: ScheduleItemType;
}

export interface Schedule {
  date: string;
  items: ScheduleItem[];
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  clinicClosed: boolean;
  specialHours?: string;
  noticeStatus: HolidayNoticeStatus;
}

export interface ClinicSettings {
  clinicIdentity: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  notifications: {
    emailAlerts: boolean;
    smsReminders: boolean;
    lowStockAlerts: boolean;
  };
  localization: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  appearance: {
    theme: string;
  };
}

export interface UIOptions {
  appointmentStatuses: AppointmentStatus[];
  patientStatuses: PatientStatus[];
  species: Species[];
  inventoryStatuses: InventoryStatus[];
  userRoles: UserRole[];
}

export interface CodaMockData {
  meta: {
    app: string;
    purpose: string;
    version: string;
    generatedAt: string;
    note: string;
  };
  clinic: Clinic;
  users: User[];
  owners: Owner[];
  patients: Patient[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  messages: Conversation[];
  inventory: InventoryItem[];
  dashboard: DashboardMetrics;
  reports: ReportsMetrics;
  notifications: Notification[];
  schedule: Schedule;
  holidays: Holiday[];
  settings: ClinicSettings;
  uiOptions: UIOptions;
}
