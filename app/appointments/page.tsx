'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import AppointmentsPage from '@/src/features/appointments/pages/appointments-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function AppointmentsRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === pathname)?.label ?? 'Appointments'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <AppointmentsPage />
    </ClinicShell>
  )
}
