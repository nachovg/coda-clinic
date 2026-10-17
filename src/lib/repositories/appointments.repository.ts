import { codaMockData } from "@/src/lib/mock-data";
import type { Appointment } from "@/src/types/domain";

const appointments = codaMockData.appointments;

export async function getAppointments(): Promise<Appointment[]> {
  return appointments;
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  return appointments.filter((appointment) => appointment.date === date);
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  return appointments.filter((appointment) => appointment.patientId === patientId);
}
