export type AppointmentStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "READY_FOR_DISCHARGE"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type Species = "dog" | "cat" | "rabbit" | "bird" | "reptile" | "other";

export type InventoryStatus =
  | "IN_STOCK"
  | "RESTOCK_SOON"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  portalAccess: boolean;
  preferredContactMethod: "sms" | "email" | "phone";
}

export interface Patient {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  sex: "male" | "female" | "unknown";
  neutered: boolean;
  dateOfBirth: string;
  ageYears: number;
  weightKg: number;
  color: string;
  microchipNumber: string | null;
  residence: string;
  status: "active" | "inactive" | "deceased";
  lastVisit: string | null;
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
  status: "up_to_date" | "due" | "overdue";
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

export interface Clinic { id: string; name: string; address: string; phone: string; email: string; timezone: string; }

export interface User { id: string; clinicId: string; displayName: string; role: string; email: string; avatar?: string; }

export interface MedicalRecord { id: string; patientId: string; veterinarianId: string; date: string; diagnosis: string; treatment: string; notes: string; }

export interface Conversation { id: string; clinicId: string; ownerId: string; patientId: string; subject: string; preview: string; lastMessageAt: string; status: string; priority: string; messages: Message[]; }

export interface Message { id: string; senderType: "owner" | "staff"; senderId: string; body: string; sentAt: string; }

export interface Notification { id: string; clinicId: string; type: string; title: string; message: string; read: boolean; createdAt: string; }

export interface InventoryItem {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  sku: string;
  onHand: number;
  reorderLevel: number;
  unit: string;
  status: InventoryStatus;
  supplier: string;
  unitCost: number;
  expirationDate: string | null;
}
