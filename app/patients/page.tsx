'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import PatientsPage from '@/src/features/patients/pages/patients-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function PatientsRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === pathname)?.label ?? 'Patients'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <PatientsPage />
    </ClinicShell>
  )
}
