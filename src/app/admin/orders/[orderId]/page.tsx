import { AdminOrderDetailPage } from '@/components/orders/admin-order-detail-page'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ orderId: '__fallback' }]
}

export default function AdminOrderDetailRoute() {
  return <AdminOrderDetailPage />
}
