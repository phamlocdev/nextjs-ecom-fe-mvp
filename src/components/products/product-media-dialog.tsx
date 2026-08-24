'use client'

import { useRef, useState } from 'react'
import { Check, ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createPresignedUploads, uploadFileToPresignedUrl } from '@/lib/api/uploads'
import { env } from '@/lib/env'
import type { ProductFormValues } from '@/lib/schemas'
import { cn } from '@/lib/utils'

type EditorImage = ProductFormValues['images'][number]

type ProductMediaDialogProps = {
  open: boolean
  libraryImages: EditorImage[]
  attachedImageKeys: string[]
  uploadSessionId?: string
  onOpenChange: (open: boolean) => void
  onLibraryImagesChange: (images: EditorImage[]) => void
  onSelectImages: (imageKeys: string[]) => void
  onUploadSessionIdChange: (uploadSessionId: string) => void
}

export function ProductMediaDialog({
  open,
  libraryImages,
  attachedImageKeys,
  uploadSessionId,
  onOpenChange,
  onLibraryImagesChange,
  onSelectImages,
  onUploadSessionIdChange,
}: ProductMediaDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(attachedImageKeys))
  const [isUploading, setIsUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    const selectedFiles = Array.from(files)
    const remainingSlots = env.productImageMaxCount - libraryImages.length
    if (selectedFiles.length > remainingSlots) {
      toast.error(`You can upload up to ${env.productImageMaxCount} images per product.`)
      return
    }

    try {
      setIsUploading(true)
      const presignResponse = await createPresignedUploads({
        scope: 'PRODUCT_IMAGE',
        uploadSessionId,
        files: selectedFiles.map((file) => ({
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        })),
      })

      if (presignResponse.uploadSessionId) {
        onUploadSessionIdChange(presignResponse.uploadSessionId)
      }

      await Promise.all(
        presignResponse.uploads.map((upload, index) =>
          uploadFileToPresignedUrl(upload, selectedFiles[index]),
        ),
      )

      const nextImages = normalizeImages([
        ...libraryImages,
        ...presignResponse.uploads.map((upload, index) => ({
          imageKey: upload.objectKey,
          alt: selectedFiles[index].name.replace(/\.[^.]+$/, ''),
          sortOrder: libraryImages.length + index,
          isPrimary: false,
          readUrl: URL.createObjectURL(selectedFiles[index]),
        })),
      ])
      onLibraryImagesChange(nextImages)
      toast.success('Images uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function toggleSelected(imageKey: string) {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(imageKey)) {
        next.delete(imageKey)
      } else {
        next.add(imageKey)
      }
      return next
    })
  }

  function applySelection() {
    onSelectImages([...selectedKeys])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-5xl'>
        <DialogHeader>
          <DialogTitle>Product media</DialogTitle>
          <DialogDescription>
            Upload new temporary images or select from the current temporary library.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex flex-col gap-3 rounded-md border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm font-medium'>
                {libraryImages.length} images in temporary library
              </p>
              <p className='text-xs text-muted-foreground'>Selected images will appear in the editor.</p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Input
                ref={fileInputRef}
                className='hidden'
                type='file'
                accept='image/jpeg,image/png,image/webp'
                multiple
                onChange={(event) => void handleFiles(event.target.files)}
              />
              <Button
                type='button'
                variant='outline'
                disabled={isUploading || libraryImages.length >= env.productImageMaxCount}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                {isUploading ? 'Uploading...' : 'Upload images'}
              </Button>
            </div>
          </div>

          {libraryImages.length === 0 ? (
            <div className='flex min-h-72 items-center justify-center rounded-md border bg-muted/40 text-sm text-muted-foreground'>
              <div className='flex flex-col items-center gap-2'>
                <ImageIcon className='size-8' />
                No temporary images uploaded
              </div>
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {libraryImages.map((image) => (
                <button
                  key={image.imageKey}
                  type='button'
                  className={cn(
                    'overflow-hidden rounded-md border bg-card text-left shadow-sm transition-colors',
                    selectedKeys.has(image.imageKey) && 'ring-2 ring-primary',
                  )}
                  onClick={() => toggleSelected(image.imageKey)}
                >
                  <div className='relative aspect-[4/3] overflow-hidden bg-muted'>
                    {image.readUrl ? (
                      <img
                        src={image.readUrl}
                        alt={image.alt ?? ''}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex h-full items-center justify-center text-muted-foreground'>
                        <ImageIcon className='size-7' />
                      </div>
                    )}
                    {selectedKeys.has(image.imageKey) ? (
                      <div className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                        <Check className='size-4' />
                      </div>
                    ) : null}
                  </div>
                  <div className='space-y-1 p-3'>
                    <p className='truncate text-sm font-medium'>
                      {image.alt?.trim() || 'Untitled image'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {attachedImageKeys.includes(image.imageKey) ? 'Shown in editor' : 'Available to add'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' onClick={applySelection}>
            Use selected ({selectedKeys.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
