import { codaMockData } from "@/src/lib/mock-data";
import type { Appointment, AppointmentStatus } from "@/src/types/domain";

const createdAppointmentsStorageKey = "coda.createdAppointments";
const updatedAppointmentsStorageKey = "coda.updatedAppointments";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return value === "SCHEDULED"
    || value === "CHECKED_IN"
    || value === "IN_PROGRESS"
    || value === "READY_FOR_DISCHARGE"
    || value === "COMPLETED"
    || value === "CANCELLED"
    || value === "NO_SHOW";
}

function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)));
  return date.getUTCFullYear() === Number(yearText)
    && date.getUTCMonth() === Number(monthText) - 1
    && date.getUTCDate() === Number(dayText);
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isAppointment(value: unknown): value is Appointment {
  return isRecord(value)
    && typeof value.id === "string" && value.id.trim().length > 0
    && typeof value.clinicId === "string" && value.clinicId.trim().length > 0
    && typeof value.patientId === "string" && value.patientId.trim().length > 0
    && typeof value.ownerId === "string" && value.ownerId.trim().length > 0
    && typeof value.veterinarianId === "string" && value.veterinarianId.trim().length > 0
    && typeof value.date === "string" && isDateOnly(value.date)
    && typeof value.startTime === "string" && isTime(value.startTime)
    && typeof value.endTime === "string" && isTime(value.endTime)
    && typeof value.durationMinutes === "number"
    && Number.isInteger(value.durationMinutes) && value.durationMinutes > 0 && value.durationMinutes < 1440
    && typeof value.reason === "string" && value.reason.trim().length > 0
    && typeof value.service === "string" && value.service.trim().length > 0
    && isAppointmentStatus(value.status)
    && typeof value.room === "string" && value.room.trim().length > 0
    && typeof value.notes === "string";
}

function getCreatedAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];

  try {
    const storedAppointments: unknown = JSON.parse(window.localStorage.getItem(createdAppointmentsStorageKey) ?? "[]");
    return Array.isArray(storedAppointments) ? storedAppointments.filter(isAppointment) : [];
  } catch {
    return [];
  }
}

function getUpdatedAppointmentStatuses(): Map<string, AppointmentStatus> {
  if (typeof window === "undefined") return new Map();

  try {
    const storedUpdates: unknown = JSON.parse(window.localStorage.getItem(updatedAppointmentsStorageKey) ?? "[]");
    if (!Array.isArray(storedUpdates)) return new Map();

    return new Map(storedUpdates.flatMap((value): [string, AppointmentStatus][] => {
      if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim() || !isAppointmentStatus(value.status)) {
        return [];
      }
      return [[value.id, value.status]];
    }));
  } catch {
    return new Map();
  }
}

function getAllAppointments(): Appointment[] {
  const originalIds = new Set(codaMockData.appointments.map((appointment) => appointment.id));
  const createdAppointments = getCreatedAppointments().filter((appointment) => !originalIds.has(appointment.id));
  const updatedStatuses = getUpdatedAppointmentStatuses();
  return [
    ...codaMockData.appointments.map((appointment) => ({
      ...appointment,
      status: updatedStatuses.get(appointment.id) ?? appointment.status,
    })),
    ...createdAppointments,
  ];
}

export async function getAppointments(): Promise<Appointment[]> {
  return getAllAppointments();
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  return (await getAppointments()).filter((appointment) => appointment.date === date);
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  return (await getAppointments()).filter((appointment) => appointment.patientId === patientId);
}

export async function createAppointment(appointment: Appointment): Promise<Appointment> {
  if (typeof window === "undefined") {
    throw new Error("Appointment storage is only available in the browser.");
  }
  if (codaMockData.appointments.some((existing) => existing.id === appointment.id)) {
    throw new Error("Appointment ID already exists.");
  }

  const createdAppointments = getCreatedAppointments();
  const updatedAppointments = [
    ...createdAppointments.filter((existing) => existing.id !== appointment.id),
    appointment,
  ];
  window.localStorage.setItem(createdAppointmentsStorageKey, JSON.stringify(updatedAppointments));
  return appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  if (typeof window === "undefined") {
    throw new Error("Appointment storage is only available in the browser.");
  }
  if (!isAppointmentStatus(status)) {
    throw new Error("Invalid appointment status.");
  }

  const createdAppointments = getCreatedAppointments();
  const createdAppointment = createdAppointments.find((appointment) => appointment.id === appointmentId);
  if (createdAppointment) {
    const updatedAppointment = { ...createdAppointment, status };
    window.localStorage.setItem(
      createdAppointmentsStorageKey,
      JSON.stringify(createdAppointments.map((appointment) => appointment.id === appointmentId ? updatedAppointment : appointment)),
    );
    return updatedAppointment;
  }

  const originalAppointment = codaMockData.appointments.find((appointment) => appointment.id === appointmentId);
  if (!originalAppointment) {
    throw new Error("Appointment could not be found.");
  }

  const updates = getUpdatedAppointmentStatuses();
  updates.set(appointmentId, status);
  window.localStorage.setItem(
    updatedAppointmentsStorageKey,
    JSON.stringify([...updates].map(([id, updatedStatus]) => ({ id, status: updatedStatus }))),
  );
  return { ...originalAppointment, status };
}
