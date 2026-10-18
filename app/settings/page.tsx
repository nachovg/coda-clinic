'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import SettingsPage from '@/src/features/settings/pages/settings-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function SettingsRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === pathname)?.label ?? 'Settings'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <SettingsPage />
    </ClinicShell>
  )
}
