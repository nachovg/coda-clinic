'use client'

import { useState, type ReactNode } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Grid2X2,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  PawPrint,
  PieChart,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { clinicNavigation } from '@/src/config/navigation'

const navigationIcons = {
  LayoutDashboard: Grid2X2,
  CalendarDays,
  UsersRound: Users,
  MessageSquare,
  Package,
  ChartNoAxesColumn: PieChart,
  Settings,
} as const

const sidebarItems = clinicNavigation
  .filter((item) => !('showInSidebar' in item) || item.showInSidebar !== false)
  .map((item) => ({ ...item, Icon: navigationIcons[item.icon] }))

type NavigationItem = (typeof clinicNavigation)[number]

function BrandMark() {
  return <div className="brand-mark"><PawPrint size={29} strokeWidth={2.8} /></div>
}

export function ClinicSidebar({ children }: { children: ReactNode }) {
  return <aside className="sidebar">{children}</aside>
}

export function ClinicTopbar({ children }: { children: ReactNode }) {
  return <header className="topbar">{children}</header>
}

function Sidebar({ active, onNavigate }: { active: string; onNavigate: (item: NavigationItem) => void }) {
  return <ClinicSidebar><div className="brand"><BrandMark /><span>CODA</span></div><nav className="nav-list" aria-label="Primary navigation">{sidebarItems.map((item) => { const Icon = item.Icon; return <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => onNavigate(item)}><Icon size={23} /><span>{item.label}</span>{'badge' in item && item.badge && <b className="nav-badge">{item.badge}</b>}</button> })}</nav><div className="profile"><div className="profile-avatar">JM</div><div><strong>Dr. Julian Miller</strong><span>Chief Vet</span></div></div></ClinicSidebar>
}

export function ClinicShell({ children, active, onNavigate }: { children: ReactNode; active: string; onNavigate: (item: NavigationItem) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const handleNavigate = (item: NavigationItem) => {
    setMobileOpen(false)
    onNavigate(item)
  }

  return <div className="app-shell"><div className={mobileOpen ? 'mobile-backdrop show' : 'mobile-backdrop'} onClick={() => setMobileOpen(false)} /><div className={mobileOpen ? 'sidebar-wrap open' : 'sidebar-wrap'}><Sidebar active={active} onNavigate={handleNavigate} /></div><main className="main-area"><ClinicTopbar><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={23} /></button><div className="search"><Search size={22} /><input aria-label="Search" placeholder="Search patients, owners or records..." /></div><button className="clinic-selector"><MapPin size={17} /> North Clinic, Tower A <ChevronDown size={15} /></button><button className="top-icon" aria-label="Notifications"><Bell size={22} /></button><button className="new-appointment"><Plus size={18} /> New Appointment</button></ClinicTopbar>{children}</main></div>
}
