import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface NavItemProps {
  to: string
  icon: ReactNode
  label: string
  /** Path prefix used to determine the active state (defaults to `to`). */
  match?: string
}

export function NavItem({ to, icon, label, match }: NavItemProps) {
  const location = useLocation()
  const matchPrefix = match ?? to
  const isActive = location.pathname === matchPrefix || location.pathname.startsWith(`${matchPrefix}/`)

  return (
    <NavLink to={to} className="group flex flex-col gap-0.5 items-center px-2 py-0.5 w-full">
      <>
        <div
          className={cn(
            'flex items-center justify-center p-2 rounded-lg transition-colors',
            isActive ? 'bg-bg-selected' : 'group-hover:bg-bg-hover'
          )}
        >
          <span
            className={cn(
              'flex items-center transition-colors',
              isActive ? 'text-text-primary signal:text-[color:var(--text-interactive)]' : 'text-text-secondary'
            )}
          >
            {icon}
          </span>
        </div>
        <span
          className={cn(
            'text-[9px] font-medium text-center leading-[115%]',
            isActive ? 'text-text-primary' : 'text-text-secondary'
          )}
        >
          {label}
        </span>
      </>
    </NavLink>
  )
}
