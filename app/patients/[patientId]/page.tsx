'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import PatientDetailPage from '@/src/features/patients/pages/patient-detail-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function PatientDetailRoute() {
  const { patientId } = useParams<{ patientId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === '/patients')?.label ?? 'Patients'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <PatientDetailPage key={pathname} patientId={patientId} />
    </ClinicShell>
  )
}
