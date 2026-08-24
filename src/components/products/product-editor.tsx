'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, GripVertical, ImageIcon, Images, Save, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProductMediaDialog } from '@/components/products/product-media-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateProductMutation, useUpdateProductMutation } from '@/hooks/use-products'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { productFormSchema, type ProductFormInput, type ProductFormValues } from '@/lib/schemas'
import type { Category, Product, ProductImage } from '@/lib/types'
import { cn } from '@/lib/utils'

type EditorImage = ProductFormValues['images'][number]

const emptyProduct: ProductFormInput = {
  name: '',
  description: '',
  categoryId: '',
  price: 1,
  images: [],
  uploadSessionId: undefined,
  status: 'ACTIVE',
}

export function ProductEditor({
  product,
  categories,
}: {
  product?: Product
  categories: Category[]
}) {
  const router = useRouter()
  const initialImages = useMemo(() => toEditorImages(product?.images ?? []), [product?.images])
  const initialFormValues = useMemo<ProductFormInput>(
    () =>
      product
        ? {
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            price: product.price,
            images: initialImages,
            uploadSessionId: undefined,
            status: product.status,
          }
        : emptyProduct,
    [initialImages, product],
  )
  const [isMediaOpen, setIsMediaOpen] = useState(false)
  const [selectedImageKeys, setSelectedImageKeys] = useState<Set<string>>(new Set())
  const [uploadedLibraryImages, setUploadedLibraryImages] = useState<EditorImage[]>(() => initialImages)
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()
  const isEdit = Boolean(product)
  const isPending = createMutation.isLoading || updateMutation.isLoading
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialFormValues,
  })
  const watchedImages = useWatch({ control: form.control, name: 'images' })
  const images = useMemo(() => toEditorImages(watchedImages ?? []), [watchedImages])
  const uploadSessionId = useWatch({ control: form.control, name: 'uploadSessionId' })
  const libraryImages = useMemo(
    () => mergeLibraryImages(images, uploadedLibraryImages, initialImages),
    [images, initialImages, uploadedLibraryImages],
  )

  async function onSubmit(values: ProductFormValues) {
    try {
      if (product) {
        await updateMutation.mutateAsync({ productId: product.productId, input: values })
        toast.success('Product updated')
      } else {
        const createdProduct = await createMutation.mutateAsync(values)
        toast.success('Product created')
        router.replace(`/admin/products/edit?productId=${createdProduct.productId}`)
        return
      }
      router.push('/admin/products')
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = images.findIndex((image) => image.imageKey === active.id)
    const newIndex = images.findIndex((image) => image.imageKey === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    form.setValue('images', normalizeImages(arrayMove(images, oldIndex, newIndex)), {
      shouldDirty: true,
    })
  }

  function toggleSelectedImage(imageKey: string) {
    setSelectedImageKeys((current) => {
      const next = new Set(current)
      if (next.has(imageKey)) {
        next.delete(imageKey)
      } else {
        next.add(imageKey)
      }
      return next
    })
  }

  function deleteSelectedImages() {
    const nextImages = normalizeImages(
      images.filter((image) => !selectedImageKeys.has(image.imageKey)),
    )
    setSelectedImageKeys(new Set())
    form.setValue('images', nextImages, { shouldDirty: true })
  }

  function setPrimary(imageKey: string) {
    form.setValue(
      'images',
      images.map((image) => ({ ...image, isPrimary: image.imageKey === imageKey })),
      { shouldDirty: true },
    )
  }

  function updateAlt(imageKey: string, alt: string) {
    const nextImages = normalizeImages(
      images.map((image) => (image.imageKey === imageKey ? { ...image, alt } : image)),
    )
    form.setValue('images', nextImages, { shouldDirty: true })
    setUploadedLibraryImages((current) =>
      current.map((image) => (image.imageKey === imageKey ? { ...image, alt } : image)),
    )
  }

  function attachLibraryImages(imageKeys: string[]) {
    const nextImages = normalizeImages(
      libraryImages
        .filter((image) => imageKeys.includes(image.imageKey))
        .map((image) => {
          const existingImage = images.find((item) => item.imageKey === image.imageKey)
          return existingImage ?? image
        }),
    )

    form.setValue('images', nextImages, { shouldDirty: true })
    setSelectedImageKeys((current) => new Set([...current].filter((key) => imageKeys.includes(key))))
  }

  return (
    <div className='mx-auto max-w-5xl space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <Link
            href='/admin/products'
            className={cn(buttonVariants({ variant: 'ghost', className: 'mb-2 px-0' }))}
          >
            <ArrowLeft />
            Products
          </Link>
          <h1 className='text-2xl font-semibold tracking-normal'>
            {isEdit ? 'Edit product' : 'New product'}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage product details and media in one workflow.
          </p>
        </div>
        <Button type='button' variant='outline' onClick={() => setIsMediaOpen(true)}>
          <Images />
          Media ({images.length})
        </Button>
      </div>

      <form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
        <section className='space-y-4 rounded-md border bg-card p-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='text-base font-semibold'>Attached images</h2>
              <p className='text-sm text-muted-foreground'>
                Preview, arrange, and describe the images that will be saved with this product.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button type='button' variant='outline' onClick={() => setIsMediaOpen(true)}>
                <Images />
                Media library
              </Button>
              <Button
                type='button'
                variant='destructive'
                disabled={selectedImageKeys.size === 0}
                onClick={deleteSelectedImages}
              >
                <Trash2 />
                Remove selected
              </Button>
            </div>
          </div>

          {images.length === 0 ? (
            <div className='flex min-h-72 items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground'>
              <div className='flex flex-col items-center gap-2'>
                <ImageIcon className='size-8' />
                No images attached yet
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((image) => image.imageKey)}
                strategy={rectSortingStrategy}
              >
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  {images.map((image) => (
                    <SortableAttachedImageCard
                      key={image.imageKey}
                      image={image}
                      selected={selectedImageKeys.has(image.imageKey)}
                      onSelectedChange={() => toggleSelectedImage(image.imageKey)}
                      onAltChange={(alt) => updateAlt(image.imageKey, alt)}
                      onSetPrimary={() => setPrimary(image.imageKey)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        <div className='grid gap-4 rounded-md border bg-card p-4 sm:grid-cols-2'>
          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className='text-xs text-destructive'>{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='price'>Price</Label>
            <Input
              id='price'
              min={1}
              step={1}
              type='number'
              aria-invalid={Boolean(form.formState.errors.price)}
              {...form.register('price', { valueAsNumber: true })}
            />
            {form.formState.errors.price ? (
              <p className='text-xs text-destructive'>{form.formState.errors.price.message}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label>Category</Label>
            {categories.length > 0 ? (
              <Controller
                control={form.control}
                name='categoryId'
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? '')}
                  >
                    <SelectTrigger
                      className='h-9 w-full'
                      aria-invalid={Boolean(form.formState.errors.categoryId)}
                    >
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.categoryId} value={category.categoryId}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input
                aria-invalid={Boolean(form.formState.errors.categoryId)}
                placeholder='electronics'
                {...form.register('categoryId')}
              />
            )}
            {form.formState.errors.categoryId ? (
              <p className='text-xs text-destructive'>{form.formState.errors.categoryId.message}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label>Status</Label>
            <Controller
              control={form.control}
              name='status'
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? 'ACTIVE')}
                >
                  <SelectTrigger className='h-9 w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>ACTIVE</SelectItem>
                    <SelectItem value='INACTIVE'>INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              rows={6}
              aria-invalid={Boolean(form.formState.errors.description)}
              {...form.register('description')}
            />
            {form.formState.errors.description ? (
              <p className='text-xs text-destructive'>
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Link href='/admin/products' className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
          <Button type='submit' disabled={isPending}>
            <Save />
            {isPending ? 'Saving...' : 'Save product'}
          </Button>
        </div>
      </form>

      <ProductMediaDialog
        key={`${product?.productId ?? 'new'}:${images.map((image) => image.imageKey).join('|')}:${isMediaOpen ? 'open' : 'closed'}`}
        open={isMediaOpen}
        libraryImages={libraryImages}
        attachedImageKeys={images.map((image) => image.imageKey)}
        uploadSessionId={uploadSessionId}
        onOpenChange={setIsMediaOpen}
        onLibraryImagesChange={setUploadedLibraryImages}
        onSelectImages={attachLibraryImages}
        onUploadSessionIdChange={(nextUploadSessionId) =>
          form.setValue('uploadSessionId', nextUploadSessionId, { shouldDirty: true })
        }
      />
    </div>
  )
}

function SortableAttachedImageCard({
  image,
  selected,
  onSelectedChange,
  onAltChange,
  onSetPrimary,
}: {
  image: EditorImage
  selected: boolean
  onSelectedChange: () => void
  onAltChange: (alt: string) => void
  onSetPrimary: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.imageKey,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-md border bg-card p-3 shadow-sm',
        selected && 'ring-2 ring-primary',
        isDragging && 'z-10 opacity-80',
      )}
    >
      <div className='mb-3 flex items-center justify-between gap-2'>
        <label className='inline-flex items-center gap-2 text-sm'>
          <input type='checkbox' checked={selected} onChange={onSelectedChange} />
          Select
        </label>
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            size='icon-sm'
            variant={image.isPrimary ? 'default' : 'outline'}
            title='Set primary image'
            aria-label='Set primary image'
            onClick={onSetPrimary}
          >
            <Star />
          </Button>
          <Button
            type='button'
            size='icon-sm'
            variant='ghost'
            title='Drag to reorder'
            aria-label='Drag to reorder'
            {...attributes}
            {...listeners}
          >
            <GripVertical />
          </Button>
        </div>
      </div>
      <div className='aspect-[4/3] overflow-hidden rounded-md bg-muted'>
        {image.readUrl ? (
          <img src={image.readUrl} alt={image.alt ?? ''} className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full items-center justify-center text-muted-foreground'>
            <ImageIcon className='size-7' />
          </div>
        )}
      </div>
      <div className='mt-3 space-y-2'>
        <Label htmlFor={`alt-${image.imageKey}`}>Alt text</Label>
        <Input
          id={`alt-${image.imageKey}`}
          value={image.alt ?? ''}
          maxLength={160}
          placeholder='Describe this image'
          onChange={(event) => onAltChange(event.target.value)}
        />
        {image.isPrimary ? (
          <p className='text-xs text-muted-foreground'>
            Primary image. This appears first in catalog views.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function normalizeImages(images: EditorImage[]): EditorImage[] {
  const sortedImages = images.map((image, index) => ({ ...image, sortOrder: index }))
  const primaryIndex = sortedImages.findIndex((image) => image.isPrimary)

  return sortedImages.map((image, index) => ({
    ...image,
    sortOrder: index,
    isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
  }))
}

function toEditorImages(images: Array<ProductImage | EditorImage>): EditorImage[] {
  return normalizeImages(
    images.map((image) => ({
      imageKey: image.imageKey,
      alt: image.alt ?? undefined,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      readUrl: image.readUrl,
    })),
  )
}

function mergeLibraryImages(
  attachedImages: EditorImage[],
  uploadedImages: EditorImage[],
  initialImages: EditorImage[],
): EditorImage[] {
  const mergedByKey = new Map<string, EditorImage>()

  ;[...initialImages, ...uploadedImages, ...attachedImages].forEach((image) => {
    mergedByKey.set(image.imageKey, {
      imageKey: image.imageKey,
      alt: image.alt ?? undefined,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      readUrl: image.readUrl,
    })
  })

  return Array.from(mergedByKey.values())
}
