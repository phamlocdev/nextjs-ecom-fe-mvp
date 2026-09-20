import { UserAccessPage } from '@/components/users/user-access-page'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ userId: '__fallback' }]
}

export default function UserAccessRoute() {
  return <UserAccessPage />
}
