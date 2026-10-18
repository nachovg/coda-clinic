'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import { clinicNavigation } from '@/src/config/navigation'
import AppointmentCreatePage from '@/src/features/appointments/pages/appointment-create-page'

export default function AppointmentCreateRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === '/appointments')?.label ?? 'Appointments'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <AppointmentCreatePage key={pathname} />
    </ClinicShell>
  )
}
