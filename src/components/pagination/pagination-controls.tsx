'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, type PageSize } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PaginationControlsProps = {
  limit: PageSize
  currentPage: number
  previousCursor: string | null
  nextCursor: string | null
  onLimitChange: (limit: PageSize) => void
  onCursorChange: (cursor: string | null) => void
}

export function PaginationControls({
  limit,
  currentPage,
  previousCursor,
  nextCursor,
  onLimitChange,
  onCursorChange,
}: PaginationControlsProps) {
  function handleLimitChange(value: string | null) {
    const nextLimit = Number(value ?? DEFAULT_PAGE_SIZE)
    if (PAGE_SIZE_OPTIONS.includes(nextLimit as PageSize)) {
      onLimitChange(nextLimit as PageSize)
    }
  }

  return (
    <div className='flex flex-col gap-3 rounded-md border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>Rows per page</span>
        <Select value={String(limit)} onValueChange={handleLimitChange}>
          <SelectTrigger size='sm' className='w-20'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center justify-end gap-2'>
        {previousCursor ? (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onCursorChange(previousCursor)}
          >
            <ChevronLeft />
            Previous
          </Button>
        ) : (
          <span
            aria-disabled='true'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'pointer-events-none opacity-50',
            )}
          >
            <ChevronLeft />
            Previous
          </span>
        )}

        <span className='flex h-7 min-w-20 items-center justify-center rounded-md border bg-background px-2.5 text-sm font-medium'>
          Page {currentPage}
        </span>

        {nextCursor ? (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onCursorChange(nextCursor)}
          >
            Next
            <ChevronRight />
          </Button>
        ) : (
          <span
            aria-disabled='true'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'pointer-events-none opacity-50',
            )}
          >
            Next
            <ChevronRight />
          </span>
        )}
      </div>
    </div>
  )
}
