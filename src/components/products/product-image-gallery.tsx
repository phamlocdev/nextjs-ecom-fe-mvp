'use client'

import { useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product, ProductImage } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProductImageGallery({ product }: { product: Product }) {
  const images = resolveImages(product)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className='overflow-hidden rounded-md border bg-muted'>
        <div className='flex aspect-[4/3] items-center justify-center text-muted-foreground'>
          <div className='flex flex-col items-center gap-2 text-sm'>
            <ImageIcon className='size-8' />
            No image
          </div>
        </div>
      </div>
    )
  }

  function scrollTo(index: number) {
    emblaApi?.scrollTo(index)
    setSelectedIndex(index)
  }

  return (
    <div className='space-y-3'>
      <div className='relative overflow-hidden rounded-md border bg-muted'>
        <div ref={emblaRef} className='overflow-hidden'>
          <div className='flex'>
            {images.map((image, index) => (
              <button
                key={image.imageKey}
                type='button'
                className='min-w-0 flex-[0_0_100%]'
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={image.readUrl}
                  alt={image.alt ?? product.name}
                  className='aspect-[4/3] w-full object-cover'
                />
              </button>
            ))}
          </div>
        </div>
        {images.length > 1 ? (
          <>
            <Button
              type='button'
              size='icon'
              variant='secondary'
              className='absolute left-3 top-1/2 -translate-y-1/2'
              aria-label='Previous image'
              onClick={() => {
                emblaApi?.scrollPrev()
                const nextIndex = Math.max(0, selectedIndex - 1)
                setSelectedIndex(nextIndex)
              }}
            >
              <ChevronLeft />
            </Button>
            <Button
              type='button'
              size='icon'
              variant='secondary'
              className='absolute right-3 top-1/2 -translate-y-1/2'
              aria-label='Next image'
              onClick={() => {
                emblaApi?.scrollNext()
                const nextIndex = Math.min(images.length - 1, selectedIndex + 1)
                setSelectedIndex(nextIndex)
              }}
            >
              <ChevronRight />
            </Button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className='grid grid-cols-5 gap-2'>
          {images.map((image, index) => (
            <button
              key={image.imageKey}
              type='button'
              className={cn(
                'overflow-hidden rounded-md border bg-muted',
                selectedIndex === index && 'ring-2 ring-primary',
              )}
              onClick={() => scrollTo(index)}
            >
              <img
                src={image.readUrl}
                alt={image.alt ?? product.name}
                className='aspect-square w-full object-cover'
              />
            </button>
          ))}
        </div>
      ) : null}

      <Lightbox
        open={lightboxIndex !== null}
        close={() => setLightboxIndex(null)}
        index={lightboxIndex ?? 0}
        slides={images.map((image) => ({
          src: image.readUrl,
          alt: image.alt ?? product.name,
        }))}
        plugins={[Zoom]}
      />
    </div>
  )
}

function resolveImages(product: Product): Array<ProductImage & { readUrl: string }> {
  const images = (product.images ?? [])
    .filter((image): image is ProductImage & { readUrl: string } => Boolean(image.readUrl))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (images.length > 0) {
    return images
  }

  return product.imageUrl
    ? [
        {
          imageKey: product.imageUrl,
          readUrl: product.imageUrl,
          alt: product.name,
          sortOrder: 0,
          isPrimary: true,
        },
      ]
    : []
}
