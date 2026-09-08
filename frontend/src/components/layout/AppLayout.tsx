import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MeadDropIcon } from '@/components/MeadDropIcon'

const navItems = [
  { to: '/', label: 'Batches', end: true },
  { to: '/brews/new', label: 'New batch', end: false },
  { to: '/recipes', label: 'Recipes', end: false },
  { to: '/prices', label: 'Prices', end: false },
]

export function AppLayout() {
  return (
    <div className="min-h-svh flex flex-col md:flex-row">
      <aside className="border-b-2 md:border-b-0 md:border-r-2 border-double md:border-double bg-card md:w-52 md:min-h-svh shrink-0">
        <div className="flex items-center gap-2 px-5 py-5">
          <MeadDropIcon className="size-4 text-primary" />
          <span className="font-serif text-base font-medium tracking-tight">Brew Tracker</span>
        </div>
        <nav className="flex flex-wrap md:flex-col gap-0.5 px-3 pb-3 md:pb-4">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'border-l-2 px-3 py-1.5 text-xs font-medium tracking-[0.06em] uppercase transition-colors duration-150 ease-out',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-5 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
