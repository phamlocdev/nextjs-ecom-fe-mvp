'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, LayoutDashboard, LogIn, LogOut, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [{ href: '/customer/products', label: 'Products', icon: Package }]

export function CustomerShell({
  children,
  userLabel,
  roleLabel,
  canAccessAdmin,
}: {
  children: React.ReactNode
  userLabel?: string
  roleLabel?: string
  canAccessAdmin: boolean
}) {
  const pathname = usePathname()
  const isSignedIn = Boolean(userLabel)

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(180deg,_#fffef8_0%,_#ffffff_45%)] text-foreground'>
      <header className='sticky top-0 z-30 border-b bg-background/90 backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <Link href='/' className='flex items-center gap-3 font-semibold tracking-tight'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
              <Boxes className='size-5' />
            </div>
            <div>
              <p>DynamoDB MVP</p>
              <p className='text-xs font-normal text-muted-foreground'>Customer catalog</p>
            </div>
          </Link>

          <nav className='hidden items-center gap-2 md:flex'>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon className='size-4' />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className='flex items-center gap-2'>
            {canAccessAdmin ? (
              <Link
                href='/admin'
                className='hidden rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:inline-flex sm:items-center sm:gap-2'
              >
                <LayoutDashboard className='size-4' />
                Admin
              </Link>
            ) : null}
            {isSignedIn ? (
              <>
                <div className='hidden text-right sm:block'>
                  <p className='text-sm font-medium'>{userLabel}</p>
                  <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
                    {roleLabel}
                  </p>
                </div>
                <Link
                  href='/auth/logout'
                  className='inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted'
                >
                  <LogOut className='size-4' />
                  Sign out
                </Link>
              </>
            ) : (
              <Link
                href='/auth/login'
                className='inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90'
              >
                <LogIn className='size-4' />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>{children}</main>
    </div>
  )
}
