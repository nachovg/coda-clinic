'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import MessagesPage from '@/src/features/messages/pages/messages-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function MessagesRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === pathname)?.label ?? 'Messages'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <MessagesPage />
    </ClinicShell>
  )
}
