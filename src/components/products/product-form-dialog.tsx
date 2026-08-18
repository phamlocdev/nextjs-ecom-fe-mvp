'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Save } from 'lucide-react'
import { toast } from 'sonner'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { productFormSchema, type ProductFormInput, type ProductFormValues } from '@/lib/schemas'
import type { Category, Product } from '@/lib/types'
import { useCreateProductMutation, useUpdateProductMutation } from '@/hooks/use-products'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const emptyProduct: ProductFormInput = {
  name: '',
  description: '',
  categoryId: '',
  price: 1,
  imageUrl: undefined,
  status: 'ACTIVE',
}

export function ProductFormDialog({
  product,
  categories,
}: {
  product?: Product
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()
  const isEdit = Boolean(product)
  const isPending = createMutation.isLoading || updateMutation.isLoading

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProduct,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      product
        ? {
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            price: product.price,
            imageUrl: product.imageUrl,
            status: product.status,
          }
        : emptyProduct,
    )
  }, [form, open, product])

  async function onSubmit(values: ProductFormValues) {
    try {
      if (product) {
        await updateMutation.mutateAsync({ productId: product.productId, input: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      toast.success(product ? 'Product updated' : 'Product created')
      setOpen(false)
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <>
      <Button
        variant={isEdit ? 'ghost' : 'default'}
        size={isEdit ? 'icon-sm' : 'default'}
        onClick={() => setOpen(true)}
      >
        {isEdit ? <Pencil /> : <Plus />}
        <span className={isEdit ? 'sr-only' : ''}>{isEdit ? 'Edit product' : 'New product'}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit product' : 'Create product'}</DialogTitle>
            <DialogDescription>
              Required fields follow the backend DTO: name, description, category, and integer VND
              price.
            </DialogDescription>
          </DialogHeader>

          <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid gap-4 sm:grid-cols-2'>
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
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.categoryId.message}
                  </p>
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

              <div className='space-y-2'>
                <Label htmlFor='imageUrl'>Image URL</Label>
                <Input
                  id='imageUrl'
                  placeholder='https://...'
                  aria-invalid={Boolean(form.formState.errors.imageUrl)}
                  {...form.register('imageUrl')}
                />
                {form.formState.errors.imageUrl ? (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.imageUrl.message}
                  </p>
                ) : null}
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  rows={5}
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

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                <Save />
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
