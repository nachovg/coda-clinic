'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClinicShell } from '@/components/clinic/ClinicShell'
import InventoryPage from '@/src/features/inventory/pages/inventory-page'
import { clinicNavigation } from '@/src/config/navigation'

export default function InventoryRoute() {
  const pathname = usePathname()
  const router = useRouter()
  const active = clinicNavigation.find((item) => item.href === pathname)?.label ?? 'Inventory'
  const navigate = (item: (typeof clinicNavigation)[number]) => router.push(item.href)

  return (
    <ClinicShell active={active} onNavigate={navigate}>
      <InventoryPage />
    </ClinicShell>
  )
}
