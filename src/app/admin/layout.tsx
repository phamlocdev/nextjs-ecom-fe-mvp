import { AppShell } from '@/components/layout/app-shell'
import { requireAdminSession } from '@/lib/auth/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdminSession('/admin')

  return (
    <AppShell userLabel={session.userLabel} roleLabel={session.roleLabel}>
      {children}
    </AppShell>
  )
}
