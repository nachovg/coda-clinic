'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import { clinicNavigation } from '@/src/config/navigation'
import AppointmentEditPage from '@/src/features/appointments/pages/appointment-edit-page'

export default function AppointmentEditRoute() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === '/appointments')?.label ?? 'Appointments'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <AppointmentEditPage key={pathname} appointmentId={appointmentId} />
    </ClinicShell>
  )
}
