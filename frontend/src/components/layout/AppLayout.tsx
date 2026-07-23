import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Beaker, DollarSign, LayoutDashboard, NotebookText, Plus } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/brews/new', label: 'New brew', icon: Plus, end: false },
  { to: '/recipes', label: 'Recipes', icon: NotebookText, end: false },
  { to: '/prices', label: 'Prices', icon: DollarSign, end: false },
]

export function AppLayout() {
  return (
    <div className="min-h-svh flex flex-col md:flex-row">
      <aside className="border-b md:border-b-0 md:border-r bg-card md:w-56 md:min-h-svh shrink-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <Beaker className="size-5 text-primary" />
          <span className="font-semibold tracking-tight">Brew Tracker</span>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-2 md:pb-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
