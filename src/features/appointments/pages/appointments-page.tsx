'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronDown, MoreHorizontal, Plus, X } from 'lucide-react'
import { codaMockData } from '@/src/lib/mock-data'
import { getAppointments } from '@/src/lib/repositories/appointments.repository'
import { getPatients } from '@/src/lib/repositories/patients.repository'
import type { Appointment, Patient } from '@/src/types/domain'

const ownerById = new Map(codaMockData.owners.map((owner) => [owner.id, owner]))
const veterinarianById = new Map(codaMockData.users.map((user) => [user.id, user]))

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function formatTime(value: string): string {
  const [hoursValue, minutes] = value.split(':')
  const hours = Number(hoursValue)
  if (!Number.isInteger(hours) || !/^\d{2}$/.test(minutes ?? '') || hours < 0 || hours > 23) {
    return 'Time unavailable'
  }

  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`
}

function getStatusLabel(status: Appointment['status']): string {
  return status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getStatusClass(status: Appointment['status']): 'progress' | 'checked' | 'scheduled' {
  if (status === 'IN_PROGRESS') return 'progress'
  if (status === 'CHECKED_IN' || status === 'COMPLETED') return 'checked'
  return 'scheduled'
}

function getPatientMeta(patient: Patient | undefined): string {
  if (!patient) return 'Patient details unavailable'
  return `${patient.breed} • ${patient.ageYears}y`
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isCurrent = true

    void Promise.all([getAppointments(), getPatients()])
      .then(([loadedAppointments, loadedPatients]) => {
        if (!isCurrent) return
        setAppointments(loadedAppointments)
        setPatients(loadedPatients)
      })
      .catch(() => {
        if (isCurrent) setLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const patientById = new Map(patients.map((patient) => [patient.id, patient]))
  const filteredAppointments = selectedDate
    ? appointments.filter((appointment) => appointment.date === selectedDate)
    : appointments

  const openDatePicker = () => {
    const dateInput = dateInputRef.current
    if (!dateInput) return
    if (typeof dateInput.showPicker === 'function') dateInput.showPicker()
    else dateInput.click()
  }

  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div>
          <h1>Appointments</h1>
          <p>Coordinate today&apos;s visits, procedures, and recovery schedules.</p>
        </div>
        <Link href="/appointments/new" className="new-appointment text-inherit no-underline"><Plus size={18} /> New Appointment</Link>
      </div>

      <div className="appointment-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="date-button" onClick={openDatePicker}>
            <CalendarDays size={18} /> {selectedDate ? formatDate(selectedDate) : 'All appointment dates'} <ChevronDown size={16} />
          </button>
          <input
            ref={dateInputRef}
            className="sr-only"
            type="date"
            aria-label="Filter appointments by date"
            tabIndex={-1}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          {selectedDate && (
            <button type="button" className="date-button" onClick={() => setSelectedDate('')} aria-label="Clear date filter">
              <X size={17} /> Clear date
            </button>
          )}
        </div>
        <div className="tabs">
          <button type="button" className="selected" aria-pressed="true">All appointments</button>
          <button type="button" aria-disabled="true" title="Appointment records do not identify surgery cases.">In surgery</button>
          <button type="button" aria-disabled="true" title="Recovery is available only as an aggregate dashboard metric.">Recovery</button>
        </div>
      </div>

      <section className="appointment-list" aria-label="Appointments">
        {isLoading ? (
          <div className="p-6 text-slate-400" role="status">Loading appointments...</div>
        ) : loadError ? (
          <div className="p-6 text-rose-300" role="alert">Appointments could not be loaded.</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-6 text-slate-400" role="status">{selectedDate ? `No appointments on ${formatDate(selectedDate)}.` : 'No appointments available.'}</div>
        ) : filteredAppointments.map((appointment) => {
          const patient = patientById.get(appointment.patientId)
          const owner = ownerById.get(appointment.ownerId)
          const veterinarian = veterinarianById.get(appointment.veterinarianId)

          return (
            <div className="appointment-card" key={appointment.id}>
              <div className="appointment-time">
                <strong>{formatTime(appointment.startTime)}</strong>
                <span>{formatDate(appointment.date)}</span>
                <span>{appointment.durationMinutes} min</span>
              </div>
              <div className="appointment-pet">
                <img
                  src={patient?.avatar ?? '/placeholder-user.jpg'}
                  alt={patient ? `${patient.name} pet` : 'Patient avatar unavailable'}
                  onError={(event) => { event.currentTarget.src = '/placeholder-user.jpg' }}
                />
                <div>
                  <strong>{patient?.name ?? 'Patient unavailable'}</strong>
                  <span>{getPatientMeta(patient)}</span>
                  <span>{owner?.displayName ?? 'Owner unavailable'}</span>
                </div>
              </div>
              <div>
                <span className="eyebrow">REASON FOR VISIT</span>
                <strong>{appointment.reason || 'Reason unavailable'}</strong>
              </div>
              <div>
                <span className="eyebrow">VETERINARIAN</span>
                <strong>{veterinarian?.displayName ?? 'Veterinarian unavailable'}</strong>
              </div>
              <span className={`status-pill ${getStatusClass(appointment.status)}`}>{getStatusLabel(appointment.status)}</span>
              <button className="icon-button" aria-label={`More actions for appointment ${appointment.id}`}><MoreHorizontal size={20} /></button>
            </div>
          )
        })}
      </section>
    </div>
  )
}
