import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string
  change: string
  tone: string
}

export function StatCard({ icon: Icon, label, value, change, tone }: StatCardProps) {
  return (
    <section className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={25} /></div>
      <span className={`stat-change ${tone}`}>{change}</span>
      <div className="stat-label">{label}</div>
      <strong className="stat-value">{value}</strong>
    </section>
  )
}
