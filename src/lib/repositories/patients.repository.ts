import { codaMockData } from "@/src/lib/mock-data";
import type { Patient } from "@/src/types/domain";

const patients = codaMockData.patients;

export async function getPatients(): Promise<Patient[]> {
  return patients;
}

export async function getPatientById(patientId: string): Promise<Patient | undefined> {
  return patients.find((patient) => patient.id === patientId);
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return patients;

  return patients.filter((patient) =>
    [patient.name, patient.breed, patient.species, patient.residence]
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  );
}
