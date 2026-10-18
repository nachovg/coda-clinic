import { codaMockData } from "@/src/lib/mock-data";
import type { Patient, Species, Sex, PatientStatus, Vaccination } from "@/src/types/domain";

const createdPatientsStorageKey = "coda.createdPatients";
const updatedPatientsStorageKey = "coda.updatedPatients";

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

function getUpdatedPatients(): Map<string, Patient> {
  if (typeof window === "undefined") return new Map();

  try {
    const storedUpdates: unknown = JSON.parse(window.localStorage.getItem(updatedPatientsStorageKey) ?? "{}");
    if (!isRecord(storedUpdates)) return new Map();

    const validUpdates = new Map<string, Patient>();
    for (const [patientId, patient] of Object.entries(storedUpdates)) {
      if (isPatient(patient) && patient.id === patientId) validUpdates.set(patientId, patient);
    }
    return validUpdates;
  } catch {
    return new Map();
  }
}

function getAllPatients(): Patient[] {
  const updates = getUpdatedPatients();
  const originalIds = new Set(codaMockData.patients.map((patient) => patient.id));
  const originalPatients = codaMockData.patients.map((patient) => updates.get(patient.id) ?? patient);
  const createdPatients = getCreatedPatients().filter((patient) => !originalIds.has(patient.id));
  return [...originalPatients, ...createdPatients];
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

export async function updatePatient(patient: Patient): Promise<Patient> {
  if (typeof window === "undefined") {
    throw new Error("Patient storage is only available in the browser.");
  }

  if (codaMockData.patients.some((original) => original.id === patient.id)) {
    const updates = getUpdatedPatients();
    updates.set(patient.id, patient);
    window.localStorage.setItem(updatedPatientsStorageKey, JSON.stringify(Object.fromEntries(updates)));
    return patient;
  }

  const createdPatients = getCreatedPatients();
  const existingIndex = createdPatients.findIndex((created) => created.id === patient.id);
  if (existingIndex === -1) throw new Error("Patient not found.");

  const updatedCreatedPatients = createdPatients.map((created) => created.id === patient.id ? patient : created);
  window.localStorage.setItem(createdPatientsStorageKey, JSON.stringify(updatedCreatedPatients));
  return patient;
}
