'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import PatientCreatePage from '@/src/features/patients/pages/patient-create-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function PatientCreateRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === '/patients')?.label ?? 'Patients'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <PatientCreatePage key={pathname} />
    </ClinicShell>
  )
}
