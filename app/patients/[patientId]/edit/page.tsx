'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import { clinicNavigation } from '@/src/config/navigation'
import PatientEditPage from '@/src/features/patients/pages/patient-edit-page'

export default function PatientEditRoute() {
  const { patientId } = useParams<{ patientId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === '/patients')?.label ?? 'Patients'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <PatientEditPage key={pathname} patientId={patientId} />
    </ClinicShell>
  )
}
