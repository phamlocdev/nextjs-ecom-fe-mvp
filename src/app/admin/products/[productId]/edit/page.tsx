import { EditProductPage } from '@/components/products/edit-product-page'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ productId: '__fallback' }]
}

export default function EditProductRoute() {
  return <EditProductPage />
}
