'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPatientById } from '@/src/lib/repositories/patients.repository'
import type { Patient } from '@/src/types/domain'
import { PatientForm } from '@/src/features/patients/components/patient-form'

function PatientEditLoading({ patientId }: { patientId: string }) {
  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div><h1>Loading patient...</h1><p>Retrieving the patient record.</p></div>
        <Link href={`/patients/${patientId}`} className="date-button text-inherit no-underline"><ArrowLeft size={18} /> Back to Patient</Link>
      </div>
      <section className="panel p-6" role="status">Loading patient record...</section>
    </div>
  )
}

function PatientEditNotFound() {
  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div><h1>Patient not found</h1><p>No patient record matches this ID.</p></div>
        <Link href="/patients" className="date-button text-inherit no-underline"><ArrowLeft size={18} /> Back to Patients</Link>
      </div>
      <section className="panel p-6" role="status">
        <p className="text-slate-300">The patient may have been removed or the link may be incorrect.</p>
      </section>
    </div>
  )
}

export default function PatientEditPage({ patientId }: { patientId: string }) {
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

  if (loadedPatient?.id !== patientId) return <PatientEditLoading patientId={patientId} />
  if (!loadedPatient.patient) return <PatientEditNotFound />
  return <PatientForm key={loadedPatient.patient.id} initialPatient={loadedPatient.patient} />
}
