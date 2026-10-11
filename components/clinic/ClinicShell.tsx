'use client'

import type { ReactNode } from 'react'

export function ClinicShell({ children, sidebar, topbar }: { children: ReactNode; sidebar: ReactNode; topbar: ReactNode }) {
  return <div className="app-shell"><div className="sidebar-wrap">{sidebar}</div><main className="main-area">{topbar}{children}</main></div>
}

export function ClinicSidebar({ children }: { children: ReactNode }) { return <aside className="sidebar">{children}</aside> }
export function ClinicTopbar({ children }: { children: ReactNode }) { return <header className="topbar">{children}</header> }
