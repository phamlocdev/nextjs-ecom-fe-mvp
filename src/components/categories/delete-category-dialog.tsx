'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteCategoryMutation } from '@/hooks/use-categories'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import type { Category } from '@/lib/types'
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

export function DeleteCategoryDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false)
  const deleteMutation = useDeleteCategoryMutation()
  const isPending = deleteMutation.isLoading

  async function onDelete() {
    try {
      await deleteMutation.mutateAsync(category.categoryId)
      toast.success('Category deleted')
      setOpen(false)
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <>
      <Button variant='destructive' size='icon-sm' onClick={() => setOpen(true)}>
        <Trash2 />
        <span className='sr-only'>Delete category</span>
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className='text-destructive' />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete <span className='font-medium text-foreground'>{category.name}</span>.
              Products that still reference this category are not updated by the backend.
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
