'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import ReportsPage from '@/src/features/reports/pages/reports-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function ReportsRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === pathname)?.label ?? 'Reports'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <ReportsPage />
    </ClinicShell>
  )
}
