import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Tag } from 'lucide-react'
import { getCategory, getProduct } from '@/lib/api'
import { formatDateTime, formatVnd } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default async function CustomerProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  let product

  try {
    product = await getProduct(productId)
  } catch {
    notFound()
  }

  if (product.status !== 'ACTIVE') {
    notFound()
  }

  const category = await getCategory(product.categoryId).catch(() => null)

  return (
    <div className='space-y-6'>
      <Link
        href='/customer/products'
        className='inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-white'
      >
        <ArrowLeft className='size-4' />
        Back to catalog
      </Link>

      <Card className='overflow-hidden rounded-[2rem] border-white/60 bg-white/90 shadow-sm'>
        <CardContent className='grid gap-8 p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8'>
          <div className='overflow-hidden rounded-[1.5rem] border bg-muted/35'>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className='h-full w-full object-cover' />
            ) : (
              <div className='flex min-h-[360px] items-center justify-center bg-[linear-gradient(135deg,_rgba(245,158,11,0.18),_rgba(15,23,42,0.04))] text-sm text-muted-foreground'>
                Product image unavailable
              </div>
            )}
          </div>

          <div className='space-y-5'>
            <div className='flex flex-wrap items-center gap-3'>
              <Badge>{product.status}</Badge>
              <span className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
                <Tag className='size-4' />
                {category?.name ?? product.categoryId}
              </span>
            </div>

            <div>
              <h1 className='text-4xl font-semibold tracking-tight'>{product.name}</h1>
              <p className='mt-3 text-3xl font-semibold text-amber-700'>{formatVnd(product.price)}</p>
            </div>

            <p className='leading-7 text-muted-foreground'>{product.description}</p>

            <div className='grid gap-4 rounded-[1.5rem] border bg-muted/30 p-5 sm:grid-cols-2'>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>Product ID</p>
                <p className='mt-2 break-all font-mono text-sm'>{product.productId}</p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>Updated</p>
                <p className='mt-2 text-sm'>{formatDateTime(product.updatedAt)}</p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>Category</p>
                <p className='mt-2 text-sm'>{category?.name ?? product.categoryId}</p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>Image URL</p>
                {product.imageUrl ? (
                  <a
                    href={product.imageUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-2 inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:underline'
                  >
                    Open original image
                    <ExternalLink className='size-4' />
                  </a>
                ) : (
                  <p className='mt-2 text-sm text-muted-foreground'>No image URL supplied</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
