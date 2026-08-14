'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, LayoutDashboard, LogOut, Package, Store, Tags, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export function AppShell({
  children,
  userLabel,
  roleLabel,
}: {
  children: React.ReactNode
  userLabel: string
  roleLabel: string
}) {
  const pathname = usePathname()

  return (
    <div className='min-h-screen bg-background'>
      <aside className='fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col'>
        <div className='flex h-16 items-center gap-3 border-b border-sidebar-border px-5'>
          <div className='flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground'>
            <Boxes className='size-5' />
          </div>
          <div>
            <p className='text-sm font-semibold'>DynamoDB MVP</p>
            <p className='text-xs text-sidebar-foreground/65'>Admin control surface</p>
          </div>
        </div>
        <nav className='space-y-1 p-3'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className='size-4' />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className='mt-auto border-t border-sidebar-border p-4'>
          <p className='text-sm font-medium'>{userLabel}</p>
          <p className='mt-1 text-xs uppercase tracking-[0.18em] text-sidebar-foreground/70'>
            {roleLabel}
          </p>
          <div className='mt-4 flex flex-col gap-2'>
            <Link
              href='/customer/products'
              className='flex items-center gap-2 rounded-md border border-sidebar-border/80 px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            >
              <Store className='size-4' />
              View catalog
            </Link>
            <Link
              href='/auth/logout'
              className='flex items-center gap-2 rounded-md border border-sidebar-border/80 px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            >
              <LogOut className='size-4' />
              Sign out
            </Link>
          </div>
        </div>
      </aside>

      <div className='lg:pl-72'>
        <header className='sticky top-0 z-30 border-b bg-background/90 backdrop-blur'>
          <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
            <Link href='/admin' className='flex items-center gap-2 font-semibold lg:hidden'>
              <Boxes className='size-5 text-primary' />
              DynamoDB MVP Admin
            </Link>
            <nav className='flex gap-1 lg:hidden'>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-md transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <Icon className='size-4' />
                  </Link>
                )
              })}
            </nav>
            <div className='hidden items-center gap-4 text-sm lg:flex'>
              <div className='text-right'>
                <p className='font-medium text-foreground'>{userLabel}</p>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
                  {roleLabel}
                </p>
              </div>
              <Link
                href='/auth/logout'
                className='inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted'
              >
                <LogOut className='size-4' />
                Sign out
              </Link>
            </div>
          </div>
        </header>
        <main className='px-4 py-6 sm:px-6 lg:px-8'>{children}</main>
      </div>
    </div>
  )
}
