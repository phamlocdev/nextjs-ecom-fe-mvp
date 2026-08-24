'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Boxes,
  CreditCard,
  Layers3,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Store,
  Tags,
  UserCog,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

const navItems = [
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventories', label: 'Inventories', icon: Layers3 },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/users', label: 'Users', icon: UserCog },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { idTokenClaims, isAuthenticated, signOut } = useAuthStore()
  const hasAdminAccess = hasRole(idTokenClaims, 'admin') || hasRole(idTokenClaims, 'manager')
  const isCustomerSignedIn = isAuthenticated && !hasAdminAccess

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign out')
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {hasAdminAccess ? (
        <aside
          className={cn(
            'fixed inset-y-0 left-0 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] lg:flex lg:flex-col',
            isSidebarExpanded ? 'w-64' : 'w-20',
          )}
        >
          <div className='flex h-16 items-center gap-3 border-b border-sidebar-border px-5'>
            <div className='flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground'>
              <Boxes className='size-5' />
            </div>
            <div className={cn('min-w-0', !isSidebarExpanded && 'hidden')}>
              <p className='text-sm font-semibold'>DynamoDB MVP</p>
              <p className='text-xs text-sidebar-foreground/65'>Admin client</p>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn('ml-auto size-9 p-0', !isSidebarExpanded && 'ml-0')}
              aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setIsSidebarExpanded((current) => !current)}
            >
              {isSidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
          </div>
          <nav className='space-y-1 p-3'>
            <Link
              href='/'
              className={cn(
                'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                pathname === '/'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Store className='size-4 shrink-0' />
              <span className={cn(!isSidebarExpanded && 'sr-only')}>Catalog</span>
            </Link>
            <div
              className={cn(
                'px-3 py-2 text-xs font-medium text-sidebar-foreground/50',
                !isSidebarExpanded && 'sr-only',
              )}
            >
              Admin
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

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
                  <Icon className='size-4 shrink-0' />
                  <span className={cn(!isSidebarExpanded && 'sr-only')}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
      ) : null}

      <div className={cn(hasAdminAccess && (isSidebarExpanded ? 'lg:pl-64' : 'lg:pl-20'))}>
        <header className='sticky top-0 z-30 border-b bg-background/90 backdrop-blur'>
          <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
            <Link href='/' className='flex items-center gap-2 font-semibold'>
              <Store className='size-5 text-primary' />
              <span className='hidden sm:inline'>Catalog</span>
            </Link>
            {hasAdminAccess ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant='outline' size='icon-sm' className='lg:hidden' />}
                  aria-label='Open navigation'
                >
                  <Menu className='size-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent className='lg:hidden'>
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Store className='size-4' />
                    Catalog
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)}>
                        <Icon className='size-4' />
                        {item.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <div className='flex items-center gap-2'>
              {isCustomerSignedIn ? (
                <>
                  <Link
                    href='/profile'
                    className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted'
                  >
                    <UserRound className='size-4' />
                    Profile
                  </Link>
                  <Link
                    href='/cart'
                    className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted'
                  >
                    <ShoppingCart className='size-4' />
                    Cart
                  </Link>
                  <Link
                    href='/orders'
                    className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted'
                  >
                    <CreditCard className='size-4' />
                    Orders
                  </Link>
                </>
              ) : null}
              {isAuthenticated ? (
                <>
                  {hasAdminAccess ? (
                    <Link
                      href='/profile'
                      aria-label='Profile'
                      title='Profile'
                      className='inline-flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-muted'
                    >
                      <UserRound className='size-4' />
                    </Link>
                  ) : null}
                  <Button type='button' variant='outline' size='sm' onClick={handleSignOut}>
                    <LogOut />
                    Sign out
                  </Button>
                </>
              ) : (
                <Link
                  href='/auth/login'
                  className='text-sm font-medium text-primary hover:underline'
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className='px-4 py-6 sm:px-6 lg:px-8'>{children}</main>
      </div>
    </div>
  )
}

function hasRole(claims: Record<string, unknown> | null, role: string): boolean {
  const groups = claims?.['cognito:groups']
  const directRole = claims?.role ?? claims?.['custom:role']

  if (Array.isArray(groups) && groups.some((value) => String(value).toLowerCase() === role)) {
    return true
  }

  if (typeof directRole === 'string') {
    return directRole.toLowerCase() === role
  }

  return false
}
