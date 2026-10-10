'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileText,
  Grid2X2,
  ListFilter,
  MapPin,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Package,
  PawPrint,
  PieChart,
  Plus,
  Search,
  Settings2,
  Stethoscope,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: Grid2X2 },
  { label: 'Appointments', icon: CalendarDays },
  { label: 'Patients', icon: Users },
  { label: 'Messages', icon: MessageSquare, badge: '12' },
  { label: 'Inventory', icon: Package },
  { label: 'Reports', icon: PieChart },
]

const patients = [
  { name: 'Cooper', meta: 'Golden Retriever • 4y', status: 'IN PROGRESS', statusType: 'progress', time: '10:30 AM', vet: 'Dr. Sarah', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=100&q=80' },
  { name: 'Luna', meta: 'Persian Cat • 2y', status: 'CHECKED IN', statusType: 'checked', time: '11:15 AM', vet: 'Dr. Julian', image: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=100&q=80' },
  { name: 'Oliver', meta: 'Beagle • 6y', status: 'SCHEDULED', statusType: 'scheduled', time: '11:45 AM', vet: 'Dr. Sarah', image: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=100&q=80' },
]

function BrandMark() {
  return <div className="brand-mark"><PawPrint size={29} strokeWidth={2.8} /></div>
}

function Sidebar({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand"><BrandMark /><span>CODA</span></div>
      <nav className="nav-list" aria-label="Primary navigation">
        {navItems.map(({ label, icon: Icon, badge }) => (
          <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}>
            <Icon size={23} />
            <span>{label}</span>
            {badge && <b className="nav-badge">{badge}</b>}
          </button>
        ))}
      </nav>
      <div className="profile"><div className="profile-avatar">JM</div><div><strong>Dr. Julian Miller</strong><span>Chief Vet</span></div></div>
    </aside>
  )
}

function StatCard({ icon: Icon, label, value, change, tone }: { icon: typeof CalendarDays; label: string; value: string; change: string; tone: string }) {
  return <section className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={25} /></div><span className={`stat-change ${tone}`}>{change}</span><div className="stat-label">{label}</div><strong className="stat-value">{value}</strong></section>
}

function PatientQueue() {
  const [filter, setFilter] = useState('All')
  return <section className="panel queue-panel"><header className="panel-header"><h2>Patient Queue</h2><div className="tabs">{['All', 'In Surgery', 'Recovery'].map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></header><div className="table-head"><span>PATIENT</span><span>STATUS</span><span>TIME</span><span>VET</span><span>ACTION</span></div><div className="patient-rows">{patients.map(patient => <div className="patient-row" key={patient.name}><div className="patient-cell"><img src={patient.image} alt={`${patient.name}, ${patient.meta}`} /><div><strong>{patient.name}</strong><span>{patient.meta}</span></div></div><span className={`status-pill ${patient.statusType}`}>{patient.statusType === 'checked' && <Check size={12} />}{patient.status}</span><strong className="appt-time">{patient.time}</strong><div className="vet"><span className="vet-avatar">{patient.vet === 'Dr. Sarah' ? 'S' : 'J'}</span><span>{patient.vet}</span></div><button className="icon-button" aria-label={`More actions for ${patient.name}`}><MoreHorizontal size={19} /></button></div>)}</div><button className="schedule-link">View Full Schedule</button></section>
}

function Messages() {
  return <section className="panel messages-panel"><header className="panel-header"><h2>Recent Messages</h2><ListFilter size={23} className="muted-icon" /></header><div className="messages-list">{[['EW', 'Emily Watson', 'Is it okay to give Cooper his me...', '2 MINS AGO', 'online'], ['DC', 'David Chen', 'Luna seems much more active ...', '1 HOUR AGO', 'away'], ['MR', 'Mark Richards', "I'd like to reschedule Oliver's c...", '4 HOURS AGO', '']].map(([initials, name, copy, time, status]) => <div className="message" key={name}><div className={`message-avatar ${initials === 'EW' ? 'dark' : ''}`}>{initials}</div><div className="message-copy"><strong>{name}</strong><span>{copy}</span><small><i className={status}></i>{time}</small></div></div>)}</div><button className="communication-button">View Communication Hub</button></section>
}

function ClinicActivity() { return <section className="panel chart-panel"><h2>Clinic Activity</h2><div className="bars">{[35, 55, 92, 42, 70, 25, 99].map((height, index) => <div key={index} className={`bar-wrap ${index === 2 ? 'highlight' : ''}`}><div className="bar" style={{ height: `${height}%` }} /></div>)}</div><div className="days">{['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => <span key={day}>{day}</span>)}</div></section> }

function Demographics() { return <section className="panel demographics"><h2>Patient Demographics</h2>{[['Canine','64%','blue'],['Feline','28%','purple'],['Other','8%','orange']].map(([label, value, color]) => <div className="demo-row" key={label}><div><span>{label}</span><b>{value}</b></div><div className="progress"><i className={color} style={{ width: value }} /></div></div>)}</section> }

function InventoryAlerts() { return <section className="panel inventory"><h2><AlertTriangle size={21} /> Inventory Alerts</h2><div className="stock-row"><div><strong>Rabies Vaccines</strong><span className="danger">Low Stock: 12 units</span></div><button>Reorder</button></div><div className="stock-row"><div><strong>Surgical Gauze</strong><span className="warning">Restock Soon: 45 units</span></div><button>Reorder</button></div></section> }

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className="app-shell"><div className={mobileOpen ? 'mobile-backdrop show' : 'mobile-backdrop'} onClick={() => setMobileOpen(false)} /><div className={mobileOpen ? 'sidebar-wrap open' : 'sidebar-wrap'}><Sidebar active={active} setActive={(v) => { setActive(v); setMobileOpen(false) }} /></div><main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={23} /></button><div className="search"><Search size={22} /><input aria-label="Search" placeholder="Search patients, owners or records..." /></div><button className="clinic-selector"><MapPin size={17} /> North Clinic, Tower A <ChevronDown size={15} /></button><button className="top-icon" aria-label="Notifications"><Bell size={22} /></button><button className="new-appointment"><Plus size={18} /> New Appointment</button></header><div className="content"><div className="stats-grid"><StatCard icon={ClipboardCheck} label="TODAY'S APPOINTMENTS" value="24" change="+12%" tone="blue" /><StatCard icon={PawPrint} label="ACTIVE PATIENTS" value="1,284" change="+4%" tone="purple" /><StatCard icon={WalletCards} label="REVENUE (TODAY)" value="$4,850" change="0%" tone="orange" /><StatCard icon={AlertTriangle} label="URGENT CASES" value="3" change="High" tone="red" /></div><div className="dashboard-grid"><div className="left-column"><PatientQueue /><div className="lower-grid"><ClinicActivity /><Demographics /></div></div><div className="right-column"><Messages /><InventoryAlerts /><section className="schedule-card"><h2>Your Schedule</h2><div><strong>Main Surgery</strong><span>1:00 PM - 3:30 PM</span></div><div><strong>Staff Meeting</strong><span>4:00 PM - 5:00 PM</span></div></section></div></div></div></main></div>
}
