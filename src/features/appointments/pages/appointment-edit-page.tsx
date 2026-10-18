'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppointmentForm from '@/src/features/appointments/components/appointment-form'
import { getAppointmentById } from '@/src/lib/repositories/appointments.repository'
import type { Appointment } from '@/src/types/domain'

export default function AppointmentEditPage({ appointmentId }: { appointmentId: string }) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let isCurrent = true
    void getAppointmentById(appointmentId)
      .then((loadedAppointment) => {
        if (isCurrent) setAppointment(loadedAppointment ?? null)
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
  }, [appointmentId])

  if (isLoading) {
    return <div className="content inner-page"><p className="text-slate-400" role="status">Loading appointment...</p></div>
  }

  if (loadError || !appointment) {
    return (
      <div className="content inner-page">
        <div className="page-heading">
          <div>
            <h1>Appointment unavailable</h1>
            <p>{loadError ? 'The appointment could not be loaded.' : 'This appointment could not be found.'}</p>
          </div>
          <Link href="/appointments" className="date-button text-inherit no-underline">Back to Appointments</Link>
        </div>
      </div>
    )
  }

  return <AppointmentForm key={appointment.id} appointment={appointment} />
}
