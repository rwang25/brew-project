import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', isActive: (path: string) => path === '/' },
  {
    to: '/brews',
    label: 'Batches',
    isActive: (path: string) => path === '/brews' || /^\/brews\/\d+/.test(path),
  },
  { to: '/recipes', label: 'Recipes', isActive: (path: string) => path.startsWith('/recipes') },
  { to: '/prices', label: 'Price book', isActive: (path: string) => path.startsWith('/prices') },
]

function HexMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <polygon points="14,1 25.3,7.5 25.3,20.5 14,27 2.7,20.5 2.7,7.5" className="fill-ink" />
      <polygon
        points="14,8.5 18.8,11.25 18.8,16.75 14,19.5 9.2,16.75 9.2,11.25"
        fill="none"
        strokeWidth="1.8"
        className="stroke-honey"
      />
    </svg>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const onNewBatch = pathname === '/brews/new'

  return (
    <div className="min-h-svh flex flex-col">
      <header className="bg-honey-wall border-b border-honey-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6 lg:px-10">
          <Link to="/" className="mr-auto flex min-h-11 items-center gap-2.5 text-ink sm:mr-0">
            <HexMark className="size-7" />
            <span className="font-display text-[19px] font-bold tracking-[-0.015em]">
              Brew Tracker
            </span>
          </Link>
          <nav aria-label="Primary" className="order-3 flex w-full flex-wrap gap-1 sm:order-2 sm:w-auto sm:flex-1">
            {navItems.map(({ to, label, isActive }) => {
              const active = isActive(pathname)
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full px-4 text-sm transition-colors duration-150 ease-out',
                    active
                      ? 'bg-ink font-semibold text-cream'
                      : 'font-medium text-[#3A2E14] hover:bg-[#F5E2A6]',
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <Link
            to="/brews/new"
            aria-current={onNewBatch ? 'page' : undefined}
            className={cn(
              'order-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-honey pl-3.5 pr-[18px] text-sm font-semibold text-ink transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.08)] sm:order-3',
              onNewBatch && 'shadow-[0_0_0_2px_var(--ink)]',
            )}
          >
            <Plus className="size-[18px]" strokeWidth={2.2} />
            New batch
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
