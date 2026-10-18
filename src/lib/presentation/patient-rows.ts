import { codaMockData } from '@/src/lib/mock-data'
import type { AppointmentStatus } from '@/src/types/domain'

type PatientRow = {
  id: string
  name: string
  breed: string
  meta: string
  status: AppointmentStatus
  statusType: 'progress' | 'checked' | 'scheduled'
  time: string
  vet: string
  image: string
}

const veterinarianById = new Map(codaMockData.users.map((user) => [user.id, user]))
const appointmentByPatientId = new Map(codaMockData.appointments.map((appointment) => [appointment.patientId, appointment]))

export const patientRows: PatientRow[] = codaMockData.patients.map((patient) => {
  const appointment = appointmentByPatientId.get(patient.id)
  const veterinarian = appointment ? veterinarianById.get(appointment.veterinarianId) : undefined
  const status = appointment?.status ?? 'SCHEDULED'

  return {
    id: patient.id,
    name: patient.name,
    breed: patient.breed,
    meta: `${patient.breed} • ${patient.ageYears}y`,
    status,
    statusType: status === 'IN_PROGRESS' ? 'progress' : status === 'CHECKED_IN' ? 'checked' : 'scheduled',
    time: appointment ? `${appointment.startTime} ${appointment.startTime < '12:00' ? 'AM' : 'PM'}` : '—',
    vet: veterinarian?.displayName ?? 'Unassigned',
    image: patient.avatar,
  }
})
