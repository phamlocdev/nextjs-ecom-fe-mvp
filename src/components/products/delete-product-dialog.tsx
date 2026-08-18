'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { useDeleteProductMutation } from '@/hooks/use-products'
import type { Product } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function DeleteProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false)
  const deleteMutation = useDeleteProductMutation()
  const isPending = deleteMutation.isLoading

  async function onDelete() {
    try {
      await deleteMutation.mutateAsync(product.productId)
      toast.success('Product deleted')
      setOpen(false)
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <>
      <Button variant='destructive' size='icon-sm' onClick={() => setOpen(true)}>
        <Trash2 />
        <span className='sr-only'>Delete product</span>
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className='text-destructive' />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className='font-medium text-foreground'>{product.name}</span> from the backend
              API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={onDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
