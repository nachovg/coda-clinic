'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { codaMockData } from '@/src/lib/mock-data'
import { createAppointment } from '@/src/lib/repositories/appointments.repository'
import { getPatients } from '@/src/lib/repositories/patients.repository'
import type { Appointment, Patient } from '@/src/types/domain'

type AppointmentFormValues = {
  patientId: string
  veterinarianId: string
  date: string
  startTime: string
  endTime: string
  reason: string
  service: string
  room: string
  notes: string
}

type AppointmentFormField = keyof AppointmentFormValues

const emptyValues: AppointmentFormValues = {
  patientId: '',
  veterinarianId: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
  service: '',
  room: '',
  notes: '',
}

const inputClassName = 'mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
const veterinarians = codaMockData.users.filter(
  (user) => (user.role === 'VETERINARIAN' || user.role === 'CHIEF_VET') && user.status === 'active',
)
const ownerById = new Map(codaMockData.owners.map((owner) => [owner.id, owner]))

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function getMinutes(value: string): number | undefined {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export default function AppointmentCreatePage() {
  const router = useRouter()
  const [values, setValues] = useState(emptyValues)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [patientLoadError, setPatientLoadError] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<AppointmentFormField, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const submissionLock = useRef(false)

  useEffect(() => {
    let isCurrent = true
    void getPatients()
      .then((loadedPatients) => {
        if (isCurrent) setPatients(loadedPatients)
      })
      .catch(() => {
        if (isCurrent) setPatientLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPatients(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const selectedPatient = patients.find((patient) => patient.id === values.patientId)
  const selectedOwner = selectedPatient ? ownerById.get(selectedPatient.ownerId) : undefined

  const updateValue = (field: AppointmentFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmissionError('')
  }

  const validate = (): Partial<Record<AppointmentFormField, string>> => {
    const nextErrors: Partial<Record<AppointmentFormField, string>> = {}
    const requiredFields: AppointmentFormField[] = ['patientId', 'veterinarianId', 'date', 'startTime', 'endTime', 'reason', 'service', 'room']
    for (const field of requiredFields) {
      if (!values[field].trim()) nextErrors[field] = 'This field is required.'
    }

    if (values.patientId && !patients.some((patient) => patient.id === values.patientId)) {
      nextErrors.patientId = 'Select a valid patient.'
    }
    if (values.veterinarianId && !veterinarians.some((veterinarian) => veterinarian.id === values.veterinarianId)) {
      nextErrors.veterinarianId = 'Select an available veterinarian.'
    }
    if (values.date && !isValidDateOnly(values.date)) nextErrors.date = 'Enter a valid date.'

    const startMinutes = values.startTime ? getMinutes(values.startTime) : undefined
    const endMinutes = values.endTime ? getMinutes(values.endTime) : undefined
    if (values.startTime && startMinutes === undefined) nextErrors.startTime = 'Enter a valid time.'
    if (values.endTime && endMinutes === undefined) nextErrors.endTime = 'Enter a valid time.'
    if (startMinutes !== undefined && endMinutes !== undefined && endMinutes <= startMinutes) {
      nextErrors.endTime = 'End time must be later than start time.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionLock.current) return
    submissionLock.current = true
    setSuccessMessage('')
    setSubmissionError('')

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      submissionLock.current = false
      return
    }

    const patient = patients.find((item) => item.id === values.patientId)
    const veterinarian = veterinarians.find((item) => item.id === values.veterinarianId)
    const startMinutes = getMinutes(values.startTime)
    const endMinutes = getMinutes(values.endTime)
    if (!patient || !veterinarian || startMinutes === undefined || endMinutes === undefined) {
      submissionLock.current = false
      setSubmissionError('Select a patient and veterinarian, then enter valid appointment times.')
      return
    }

    const appointment: Appointment = {
      id: `appt_${crypto.randomUUID()}`,
      clinicId: codaMockData.clinic.id,
      patientId: patient.id,
      ownerId: patient.ownerId,
      veterinarianId: veterinarian.id,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      durationMinutes: endMinutes - startMinutes,
      reason: values.reason.trim(),
      service: values.service.trim(),
      status: 'SCHEDULED',
      room: values.room.trim(),
      notes: values.notes.trim(),
    }

    setIsSubmitting(true)
    try {
      await createAppointment(appointment)
      setSuccessMessage('Appointment saved successfully. Returning to Appointments...')
      window.setTimeout(() => router.push('/appointments'), 700)
    } catch {
      submissionLock.current = false
      setSubmissionError('The appointment could not be saved. Check your browser storage and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldError = (field: AppointmentFormField) => errors[field]

  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div>
          <h1>New Appointment</h1>
          <p>Schedule a visit for a patient at the clinic.</p>
        </div>
        <Link href="/appointments" className="date-button text-inherit no-underline"><ArrowLeft size={18} /> Cancel</Link>
      </div>

      {patientLoadError && <p className="mb-5 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300" role="alert">Patient options could not be loaded.</p>}

      <form className="panel p-6 md:p-8" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {submissionError && <p className="mb-5 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300" role="alert">{submissionError}</p>}
        {successMessage && <p className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-300" role="status">{successMessage}</p>}

        <section aria-labelledby="appointment-details-heading">
          <h2 id="appointment-details-heading" className="mb-5 text-xl font-semibold text-white">Appointment Information</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-slate-200">Patient *
              <select className={inputClassName} value={values.patientId} onChange={(event) => updateValue('patientId', event.target.value)} aria-invalid={Boolean(fieldError('patientId'))} aria-describedby={fieldError('patientId') ? 'patient-error' : undefined} disabled={isLoadingPatients || patientLoadError}>
                <option value="">{isLoadingPatients ? 'Loading patients...' : patients.length ? 'Select a patient' : 'No patients available'}</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.species} · {patient.breed}</option>)}
              </select>
              {fieldError('patientId') && <span id="patient-error" className="mt-1 block text-xs text-rose-300">{fieldError('patientId')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Veterinarian *
              <select className={inputClassName} value={values.veterinarianId} onChange={(event) => updateValue('veterinarianId', event.target.value)} aria-invalid={Boolean(fieldError('veterinarianId'))} aria-describedby={fieldError('veterinarianId') ? 'veterinarian-error' : undefined}>
                <option value="">Select a veterinarian</option>
                {veterinarians.map((veterinarian) => <option key={veterinarian.id} value={veterinarian.id}>{veterinarian.displayName}</option>)}
              </select>
              {fieldError('veterinarianId') && <span id="veterinarian-error" className="mt-1 block text-xs text-rose-300">{fieldError('veterinarianId')}</span>}
            </label>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-400" role="status">
              Owner is linked from the selected patient: <strong className="text-slate-200">{selectedOwner?.displayName ?? (values.patientId ? 'Owner unavailable' : 'Select a patient')}</strong>
            </div>
            <label className="text-sm font-medium text-slate-200">Date *
              <input className={inputClassName} type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} aria-invalid={Boolean(fieldError('date'))} aria-describedby={fieldError('date') ? 'date-error' : undefined} />
              {fieldError('date') && <span id="date-error" className="mt-1 block text-xs text-rose-300">{fieldError('date')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Start time *
              <input className={inputClassName} type="time" value={values.startTime} onChange={(event) => updateValue('startTime', event.target.value)} aria-invalid={Boolean(fieldError('startTime'))} aria-describedby={fieldError('startTime') ? 'startTime-error' : undefined} />
              {fieldError('startTime') && <span id="startTime-error" className="mt-1 block text-xs text-rose-300">{fieldError('startTime')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">End time *
              <input className={inputClassName} type="time" value={values.endTime} onChange={(event) => updateValue('endTime', event.target.value)} aria-invalid={Boolean(fieldError('endTime'))} aria-describedby={fieldError('endTime') ? 'endTime-error' : undefined} />
              {fieldError('endTime') && <span id="endTime-error" className="mt-1 block text-xs text-rose-300">{fieldError('endTime')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Reason for visit *
              <input className={inputClassName} value={values.reason} onChange={(event) => updateValue('reason', event.target.value)} aria-invalid={Boolean(fieldError('reason'))} aria-describedby={fieldError('reason') ? 'reason-error' : undefined} />
              {fieldError('reason') && <span id="reason-error" className="mt-1 block text-xs text-rose-300">{fieldError('reason')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Service *
              <input className={inputClassName} value={values.service} onChange={(event) => updateValue('service', event.target.value)} aria-invalid={Boolean(fieldError('service'))} aria-describedby={fieldError('service') ? 'service-error' : undefined} />
              {fieldError('service') && <span id="service-error" className="mt-1 block text-xs text-rose-300">{fieldError('service')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Room *
              <input className={inputClassName} value={values.room} onChange={(event) => updateValue('room', event.target.value)} aria-invalid={Boolean(fieldError('room'))} aria-describedby={fieldError('room') ? 'room-error' : undefined} />
              {fieldError('room') && <span id="room-error" className="mt-1 block text-xs text-rose-300">{fieldError('room')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200 md:col-span-2 xl:col-span-3">Notes <span className="font-normal text-slate-400">(optional)</span>
              <textarea className={`${inputClassName} min-h-24 resize-y`} value={values.notes} onChange={(event) => updateValue('notes', event.target.value)} />
            </label>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-700 pt-6">
          <Link href="/appointments" className="date-button text-inherit no-underline">Cancel</Link>
          <button className="new-appointment disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting || isLoadingPatients || patientLoadError || patients.length === 0}>
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
