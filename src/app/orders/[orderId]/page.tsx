import { OrderDetailPage } from '@/components/orders/order-detail-page'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ orderId: '__fallback' }]
}

export default function OrderDetailRoute() {
  return <OrderDetailPage />
}
