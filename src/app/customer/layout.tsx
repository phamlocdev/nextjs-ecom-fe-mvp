import { CustomerShell } from '@/components/layout/customer-shell'
import { getCurrentSessionSummary } from '@/lib/auth/server'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSessionSummary()

  return (
    <CustomerShell
      userLabel={session?.userLabel}
      roleLabel={session?.roleLabel}
      canAccessAdmin={Boolean(session?.groups.some((group) => group === 'admin' || group === 'manager'))}
    >
      {children}
    </CustomerShell>
  )
}
