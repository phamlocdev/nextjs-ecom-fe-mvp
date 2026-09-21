import { ProductDetailPage } from '@/components/products/product-detail-page'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ id: '__fallback' }, { id: '__template' }]
}

export default function ProductDetailRoute() {
  return <ProductDetailPage />
}
