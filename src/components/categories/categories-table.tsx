import { formatDateTime } from '@/lib/format'
import type { Category } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog'

export function CategoriesTable({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No categories yet</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Create a category before adding products.
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className='w-24 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.categoryId}>
              <TableCell className='font-medium'>{category.name}</TableCell>
              <TableCell className='font-mono text-xs text-muted-foreground'>
                {category.categoryId}
              </TableCell>
              <TableCell className='max-w-md'>
                <p className='line-clamp-2 text-sm text-muted-foreground'>
                  {category.description ?? 'No description'}
                </p>
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {formatDateTime(category.updatedAt)}
              </TableCell>
              <TableCell>
                <div className='flex justify-end gap-1'>
                  <CategoryFormDialog category={category} />
                  <DeleteCategoryDialog category={category} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
