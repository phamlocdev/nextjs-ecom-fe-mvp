'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteCategoryAction } from '@/app/actions'
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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.categoryId)

      if (!result.ok) {
        toast.error(result.message, {
          description:
            result.details && result.details.length > 0 ? result.details.join('\n') : undefined,
        })
        return
      }

      toast.success('Category deleted')
      setOpen(false)
      router.refresh()
    })
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
