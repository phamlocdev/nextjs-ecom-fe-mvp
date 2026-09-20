'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Category, ProductFilterParams, ProductStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ANY_VALUE = '__any__'
const SEARCH_DEBOUNCE_MS = 400

type CatalogFilterSidebarProps = {
  categories: Category[]
  filters: ProductFilterParams
  onFiltersChange: (filters: ProductFilterParams) => void
}

export function CatalogFilterSidebar({
  categories,
  filters,
  onFiltersChange,
}: CatalogFilterSidebarProps) {
  const [keyword, setKeyword] = useState(filters.q ?? '')

  useEffect(() => {
    setKeyword(filters.q ?? '')
  }, [filters.q])

  useEffect(() => {
    if (keyword === (filters.q ?? '')) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      updateFilter({ ...filters, q: keyword })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [filters, keyword])

  function updateFilter(nextFilters: ProductFilterParams): void {
    onFiltersChange(removeEmptyFilters(nextFilters))
  }

  return (
    <aside className='space-y-5 rounded-md border bg-card p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h2 className='text-base font-semibold'>Filters</h2>
          <p className='text-xs text-muted-foreground'>Refine product results</p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => onFiltersChange({})}
          disabled={countActiveFilters(filters) === 0}
        >
          <X />
          Clear
        </Button>
      </div>

      <section className='space-y-2'>
        <Label htmlFor='catalogSearch'>Keyword</Label>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            id='catalogSearch'
            className='pl-9'
            placeholder='Search products'
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </section>

      <section className='space-y-2'>
        <Label>Category</Label>
        <Select
          value={filters.categoryId ?? ANY_VALUE}
          onValueChange={(value) =>
            updateFilter({
              ...filters,
              categoryId: typeof value === 'string' && value !== ANY_VALUE ? value : undefined,
            })
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.categoryId} value={category.categoryId}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className='space-y-2'>
        <Label>Status</Label>
        <Select
          value={filters.status ?? ANY_VALUE}
          onValueChange={(value) =>
            updateFilter({
              ...filters,
              status:
                value === 'ACTIVE' || value === 'INACTIVE' ? (value as ProductStatus) : undefined,
            })
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>All statuses</SelectItem>
            <SelectItem value='ACTIVE'>ACTIVE</SelectItem>
            <SelectItem value='INACTIVE'>INACTIVE</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className='space-y-3'>
        <Label>Price range</Label>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
          <div className='space-y-2'>
            <Label htmlFor='catalogMinPrice' className='text-xs text-muted-foreground'>
              From
            </Label>
            <Input
              id='catalogMinPrice'
              min={1}
              step={1}
              type='number'
              value={filters.minPrice ?? ''}
              onChange={(event) =>
                updateFilter({
                  ...filters,
                  minPrice: parsePositiveInteger(event.target.value),
                })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='catalogMaxPrice' className='text-xs text-muted-foreground'>
              To
            </Label>
            <Input
              id='catalogMaxPrice'
              min={1}
              step={1}
              type='number'
              value={filters.maxPrice ?? ''}
              onChange={(event) =>
                updateFilter({
                  ...filters,
                  maxPrice: parsePositiveInteger(event.target.value),
                })
              }
            />
          </div>
        </div>
      </section>

      <section className='space-y-3'>
        <Label>Updated</Label>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
          <Input
            aria-label='Updated from date'
            type='date'
            value={filters.updatedFrom ? toLocalDateInput(filters.updatedFrom) : ''}
            onChange={(event) =>
              updateFilter({
                ...filters,
                updatedFrom: event.target.value ? localDateStartIso(event.target.value) : undefined,
              })
            }
          />
          <Input
            aria-label='Updated to date'
            type='date'
            value={filters.updatedTo ? toLocalDateInput(filters.updatedTo) : ''}
            onChange={(event) =>
              updateFilter({
                ...filters,
                updatedTo: event.target.value ? localDateEndIso(event.target.value) : undefined,
              })
            }
          />
        </div>
      </section>
    </aside>
  )
}

function removeEmptyFilters(filters: ProductFilterParams): ProductFilterParams {
  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.minPrice !== undefined ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice !== undefined ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.updatedFrom ? { updatedFrom: filters.updatedFrom } : {}),
    ...(filters.updatedTo ? { updatedTo: filters.updatedTo } : {}),
    ...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
  }
}

function parsePositiveInteger(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined
}

function countActiveFilters(filters: ProductFilterParams): number {
  return [
    filters.categoryId,
    filters.status,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? 'price' : undefined,
    filters.updatedFrom || filters.updatedTo ? 'updated' : undefined,
    filters.q,
  ].filter(Boolean).length
}

function toLocalDateInput(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDateStartIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
}

function localDateEndIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
}
