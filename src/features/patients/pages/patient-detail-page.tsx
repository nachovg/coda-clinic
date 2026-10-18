'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, HeartPulse, MapPin, PawPrint, Pencil, UserRound } from 'lucide-react'
import { codaMockData } from '@/src/lib/mock-data'
import { getPatientById } from '@/src/lib/repositories/patients.repository'
import type { MedicalRecord, Patient } from '@/src/types/domain'

const ownerById = new Map(codaMockData.owners.map((owner) => [owner.id, owner]))
const veterinarianById = new Map(codaMockData.users.map((user) => [user.id, user]))

function formatDate(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="mt-2 break-words text-base font-medium text-white">{value}</dd>
    </div>
  )
}

function EmptyDetail({ children }: { children: string }) {
  return <p className="py-4 text-sm text-slate-400">{children}</p>
}

function PatientNotFound() {
  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div>
          <h1>Patient not found</h1>
          <p>No patient record matches this ID.</p>
        </div>
        <Link href="/patients" className="date-button text-inherit no-underline">
          <ArrowLeft size={18} /> Back to Patients
        </Link>
      </div>
      <section className="panel p-6" role="status">
        <p className="text-slate-300">The patient may have been removed or the link may be incorrect.</p>
      </section>
    </div>
  )
}

function PatientLoading() {
  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div>
          <h1>Loading patient...</h1>
          <p>Retrieving the patient record.</p>
        </div>
        <Link href="/patients" className="date-button text-inherit no-underline">
          <ArrowLeft size={18} /> Back to Patients
        </Link>
      </div>
      <section className="panel p-6" role="status">Loading patient record...</section>
    </div>
  )
}

export default function PatientDetailPage({ patientId }: { patientId: string }) {
  const [loadedPatient, setLoadedPatient] = useState<{ id: string; patient: Patient | undefined }>()

  useEffect(() => {
    let isCurrent = true

    void getPatientById(patientId)
      .then((patient) => {
        if (isCurrent) setLoadedPatient({ id: patientId, patient })
      })
      .catch(() => {
        if (isCurrent) setLoadedPatient({ id: patientId, patient: undefined })
      })

    return () => {
      isCurrent = false
    }
  }, [patientId])

  if (loadedPatient?.id !== patientId) return <PatientLoading />
  if (!loadedPatient.patient) return <PatientNotFound />

  const patient = loadedPatient.patient
  const owner = ownerById.get(patient.ownerId)
  const records: MedicalRecord[] = codaMockData.medicalRecords.filter((record) => record.patientId === patient.id)

  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div className="flex items-center gap-5">
          <img
            src={patient.avatar}
            alt={`${patient.name} pet`}
            className="h-20 w-20 rounded-xl object-cover"
            onError={(event) => { event.currentTarget.src = '/placeholder-user.jpg' }}
          />
          <div>
            <h1>{patient.name}</h1>
            <p className="capitalize">{patient.species} · {patient.breed}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/patients/${patient.id}/edit`} className="new-appointment text-inherit no-underline">
            <Pencil size={18} /> Edit Patient
          </Link>
          <Link href="/patients" className="date-button text-inherit no-underline">
            <ArrowLeft size={18} /> Back to Patients
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel p-6">
          <header className="panel-header -mx-6 -mt-6 mb-6 px-6">
            <h2><PawPrint className="mr-2 inline text-blue-500" size={21} /> Patient Information</h2>
            <span className="status-pill scheduled capitalize">{patient.status}</span>
          </header>
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Species" value={patient.species} />
            <DetailItem label="Breed" value={patient.breed} />
            <DetailItem label="Age" value={`${patient.ageYears} ${patient.ageYears === 1 ? 'year' : 'years'}`} />
            <DetailItem label="Sex" value={patient.sex} />
            <DetailItem label="Neutered" value={patient.neutered ? 'Yes' : 'No'} />
            <DetailItem label="Weight" value={`${patient.weightKg} kg`} />
            <DetailItem label="Color" value={patient.color} />
            <DetailItem label="Residence" value={patient.residence} />
            <DetailItem label="Last visit" value={patient.lastVisit ? formatDate(patient.lastVisit) : 'No previous visits recorded'} />
            <DetailItem label="Next appointment" value={patient.nextAppointment ? formatDateTime(patient.nextAppointment) : 'No appointment scheduled'} />
            <DetailItem label="Microchip" value={patient.microchipNumber ?? 'Not recorded'} />
          </dl>
        </section>

        <section className="panel p-6">
          <header className="panel-header -mx-6 -mt-6 mb-6 px-6">
            <h2><UserRound className="mr-2 inline text-blue-500" size={21} /> Owner Information</h2>
          </header>
          {owner ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Name" value={owner.displayName} />
              <DetailItem label="Email" value={owner.email} />
              <DetailItem label="Phone" value={owner.phone} />
              <DetailItem label="Address" value={`${owner.address.city}, ${owner.address.state} ${owner.address.postalCode}`} />
              <DetailItem label="Preferred contact" value={owner.preferredContactMethod} />
            </dl>
          ) : <EmptyDetail>Owner information is unavailable.</EmptyDetail>}
        </section>

        <section className="panel p-6">
          <header className="panel-header -mx-6 -mt-6 mb-6 px-6">
            <h2><HeartPulse className="mr-2 inline text-blue-500" size={21} /> Clinical Information</h2>
          </header>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-white">Allergies</h3>
              {patient.allergies.length ? <ul className="mt-2 list-inside list-disc text-slate-300">{patient.allergies.map((allergy) => <li key={allergy}>{allergy}</li>)}</ul> : <EmptyDetail>No allergies recorded.</EmptyDetail>}
            </div>
            <div>
              <h3 className="font-semibold text-white">Conditions</h3>
              {patient.conditions.length ? <ul className="mt-2 list-inside list-disc text-slate-300">{patient.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul> : <EmptyDetail>No conditions recorded.</EmptyDetail>}
            </div>
            <div className="sm:col-span-2">
              <h3 className="font-semibold text-white">Notes</h3>
              <p className="mt-2 text-slate-300">{patient.notes || 'No notes recorded.'}</p>
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <header className="panel-header -mx-6 -mt-6 mb-6 px-6">
            <h2><CalendarDays className="mr-2 inline text-blue-500" size={21} /> Vaccinations</h2>
          </header>
          {patient.vaccinations.length ? (
            <div className="space-y-3">
              {patient.vaccinations.map((vaccination) => (
                <article key={`${vaccination.name}-${vaccination.date}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{vaccination.name}</h3>
                    <span className="text-sm capitalize text-emerald-400">{vaccination.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Given {formatDate(vaccination.date)} · Next due {formatDate(vaccination.nextDue)}</p>
                </article>
              ))}
            </div>
          ) : <EmptyDetail>No vaccination records available.</EmptyDetail>}
        </section>

        <section className="panel p-6 xl:col-span-2">
          <header className="panel-header -mx-6 -mt-6 mb-6 px-6">
            <h2><HeartPulse className="mr-2 inline text-blue-500" size={21} /> Medical Records</h2>
          </header>
          {records.length ? (
            <div className="space-y-4">
              {records.map((record) => {
                const veterinarian = veterinarianById.get(record.veterinarianId)
                return (
                  <article key={record.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white">{record.diagnosis}</h3>
                        <p className="mt-1 text-sm capitalize text-slate-400">{record.type.replace(/_/g, ' ')} · {formatDate(record.date)}</p>
                      </div>
                      <span className="text-sm text-slate-400">{veterinarian?.displayName ?? 'Veterinarian unavailable'}</span>
                    </div>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <DetailItem label="Subjective" value={record.subjective} />
                      <DetailItem label="Objective" value={record.objective} />
                      <DetailItem label="Assessment" value={record.assessment} />
                      <DetailItem label="Plan" value={record.plan} />
                      <DetailItem label="Weight" value={`${record.weightKg} kg`} />
                      <DetailItem label="Temperature" value={`${record.temperatureC} °C`} />
                      <DetailItem label="Heart rate" value={`${record.heartRateBpm} bpm`} />
                      <DetailItem label="Respiratory rate" value={`${record.respiratoryRateBpm} breaths/min`} />
                    </dl>
                  </article>
                )
              })}
            </div>
          ) : <EmptyDetail>No medical records available.</EmptyDetail>}
        </section>
      </div>
    </div>
  )
}
