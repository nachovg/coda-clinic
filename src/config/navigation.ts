export const clinicNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Appointments", href: "/appointments", icon: "CalendarDays" },
  { label: "Patients", href: "/patients", icon: "UsersRound" },
  { label: "Messages", href: "/messages", icon: "MessageSquare", badge: "12" },
  { label: "Inventory", href: "/inventory", icon: "Package" },
  { label: "Reports", href: "/reports", icon: "ChartNoAxesColumn" },
  { label: "Settings", href: "/settings", icon: "Settings", showInSidebar: false },
] as const;
