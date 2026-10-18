import { codaMockData } from "@/src/lib/mock-data";
import type { Patient, Species, Sex, PatientStatus, Vaccination } from "@/src/types/domain";

const createdPatientsStorageKey = "coda.createdPatients";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSpecies(value: unknown): value is Species {
  return value === "dog" || value === "cat" || value === "rabbit" || value === "bird" || value === "reptile" || value === "other";
}

function isSex(value: unknown): value is Sex {
  return value === "male" || value === "female";
}

function isPatientStatus(value: unknown): value is PatientStatus {
  return value === "active" || value === "inactive" || value === "deceased";
}

function isVaccination(value: unknown): value is Vaccination {
  return isRecord(value)
    && typeof value.name === "string"
    && typeof value.date === "string"
    && typeof value.nextDue === "string"
    && value.status === "up_to_date";
}

function isPatient(value: unknown): value is Patient {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.clinicId === "string"
    && typeof value.ownerId === "string"
    && typeof value.name === "string"
    && isSpecies(value.species)
    && typeof value.breed === "string"
    && isSex(value.sex)
    && typeof value.neutered === "boolean"
    && typeof value.dateOfBirth === "string"
    && typeof value.ageYears === "number"
    && typeof value.weightKg === "number"
    && typeof value.color === "string"
    && (typeof value.microchipNumber === "string" || value.microchipNumber === null)
    && typeof value.residence === "string"
    && isPatientStatus(value.status)
    && typeof value.lastVisit === "string"
    && (typeof value.nextAppointment === "string" || value.nextAppointment === null)
    && typeof value.avatar === "string"
    && Array.isArray(value.allergies)
    && value.allergies.every((item) => typeof item === "string")
    && Array.isArray(value.conditions)
    && value.conditions.every((item) => typeof item === "string")
    && typeof value.notes === "string"
    && Array.isArray(value.vaccinations)
    && value.vaccinations.every(isVaccination);
}

function getCreatedPatients(): Patient[] {
  if (typeof window === "undefined") return [];

  try {
    const storedPatients: unknown = JSON.parse(window.localStorage.getItem(createdPatientsStorageKey) ?? "[]");
    return Array.isArray(storedPatients) ? storedPatients.filter(isPatient) : [];
  } catch {
    return [];
  }
}

function getAllPatients(): Patient[] {
  return [...codaMockData.patients, ...getCreatedPatients()];
}

export async function getPatients(): Promise<Patient[]> {
  return getAllPatients();
}

export async function getPatientById(patientId: string): Promise<Patient | undefined> {
  return getAllPatients().find((patient) => patient.id === patientId);
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const patients = getAllPatients();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return patients;

  return patients.filter((patient) =>
    [patient.name, patient.breed, patient.species, patient.residence]
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  );
}

export async function createPatient(patient: Patient): Promise<Patient> {
  if (typeof window === "undefined") {
    throw new Error("Patient storage is only available in the browser.");
  }

  const createdPatients = getCreatedPatients();
  const updatedPatients = [...createdPatients.filter((existing) => existing.id !== patient.id), patient];
  window.localStorage.setItem(createdPatientsStorageKey, JSON.stringify(updatedPatients));
  return patient;
}
