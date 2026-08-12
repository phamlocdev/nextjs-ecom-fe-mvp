'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { Category, PageSize, ProductFilterParams, ProductStatus } from '@/lib/types'
import { getPaginationHref } from '@/lib/pagination'
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

const ANY_VALUE = '__any__'
const PRICE_SLIDER_MIN = 0
const PRICE_SLIDER_MAX = 10000000
const PRICE_SLIDER_STEP = 10000
const FILTER_TOAST_KEY = 'products:pending-filter-toast'

type FilterSection = 'category' | 'status' | 'price' | 'updated' | 'search'
type UpdatedPreset = 'this-week' | 'last-week' | 'this-month' | 'this-year' | 'custom'

type FilterDraft = {
  enabled: Record<FilterSection, boolean>
  categoryId: string
  status: ProductStatus | ''
  minPrice: string
  maxPrice: string
  updatedPreset: UpdatedPreset
  updatedFrom: string
  updatedTo: string
  q: string
}

type DraftResult =
  { filters: ProductFilterParams; error: null } | { filters: ProductFilterParams; error: string }

type ProductFiltersDialogProps = {
  categories: Category[]
  filters: ProductFilterParams
  limit: PageSize
  scannedCount?: number
}

const sectionLabels: Array<{ id: FilterSection; label: string }> = [
  { id: 'category', label: 'Category' },
  { id: 'status', label: 'Status' },
  { id: 'price', label: 'Price range' },
  { id: 'updated', label: 'Updated' },
  { id: 'search', label: 'Keyword' },
]

export function ProductFiltersDialog({
  categories,
  filters,
  limit,
  scannedCount,
}: ProductFiltersDialogProps) {
  const pathname = usePathname()
  const router = useRouter()
  const filtersKey = createFilterKey(filters)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FilterDraft>(() => createDraftFromFilters(filters))
  const draftResult = useMemo(() => createFiltersFromDraft(draft), [draft])
  const draftKey = createFilterKey(draftResult.filters)
  const activeCount = countActiveFilters(filters)

  useEffect(() => {
    setDraft(createDraftFromFilters(filters))
  }, [filters, filtersKey])

  useEffect(() => {
    const pendingKey = window.sessionStorage.getItem(FILTER_TOAST_KEY)
    if (!pendingKey || pendingKey !== filtersKey || scannedCount === undefined) {
      return
    }

    toast.success(`Scanned ${scannedCount} rows.`)
    window.sessionStorage.removeItem(FILTER_TOAST_KEY)
  }, [categories, filters, filtersKey, scannedCount])

  function updateDraft(updater: (current: FilterDraft) => FilterDraft): void {
    setDraft((current) => updater(current))
  }

  function toggleSection(section: FilterSection): void {
    updateDraft((current) => {
      const nextEnabled = !current.enabled[section]
      return clearSection(
        { ...current, enabled: { ...current.enabled, [section]: nextEnabled } },
        section,
        nextEnabled,
      )
    })
  }

  function handlePriceRangeChange(field: 'minPrice' | 'maxPrice', value: number): void {
    updateDraft((current) => {
      const currentMin = readPrice(current.minPrice) ?? PRICE_SLIDER_MIN
      const currentMax = readPrice(current.maxPrice) ?? PRICE_SLIDER_MAX
      if (field === 'minPrice') {
        return { ...current, minPrice: String(Math.min(value, currentMax)) }
      }
      return { ...current, maxPrice: String(Math.max(value, currentMin)) }
    })
  }

  function applyUpdatedPreset(preset: UpdatedPreset): void {
    const range = preset === 'custom' ? null : getUpdatedPresetRange(preset)
    updateDraft((current) => ({
      ...current,
      updatedPreset: preset,
      ...(range ? { updatedFrom: range.from, updatedTo: range.to } : {}),
    }))
  }

  function clearFilters(): void {
    setDraft(createEmptyDraft())
  }

  function applyFilters(): void {
    if (draftResult.error) {
      return
    }

    if (draftKey) {
      window.sessionStorage.setItem(FILTER_TOAST_KEY, draftKey)
    } else {
      window.sessionStorage.removeItem(FILTER_TOAST_KEY)
    }

    router.push(getPaginationHref(pathname, { limit, ...draftResult.filters }))
    setOpen(false)
  }

  const minSliderValue = clamp(
    readPrice(draft.minPrice) ?? PRICE_SLIDER_MIN,
    PRICE_SLIDER_MIN,
    PRICE_SLIDER_MAX,
  )
  const maxSliderValue = clamp(
    readPrice(draft.maxPrice) ?? PRICE_SLIDER_MAX,
    PRICE_SLIDER_MIN,
    PRICE_SLIDER_MAX,
  )

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <SlidersHorizontal />
        Filter {activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Product filters</DialogTitle>
            <DialogDescription>
              Choose filter fields, then click Done to apply them.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-5'>
            <div className='flex flex-wrap gap-2'>
              {sectionLabels.map((section) => (
                <Button
                  key={section.id}
                  type='button'
                  size='sm'
                  variant={draft.enabled[section.id] ? 'default' : 'outline'}
                  onClick={() => toggleSection(section.id)}
                >
                  {section.label}
                </Button>
              ))}
            </div>

            {draft.enabled.category ? (
              <section className='space-y-2 rounded-md border p-3'>
                <Label>Category</Label>
                <Select
                  value={draft.categoryId || ANY_VALUE}
                  onValueChange={(value) =>
                    updateDraft((current) => ({
                      ...current,
                      categoryId: value && value !== ANY_VALUE ? value : '',
                    }))
                  }
                >
                  <SelectTrigger className='h-9 w-full'>
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
            ) : null}

            {draft.enabled.status ? (
              <section className='space-y-2 rounded-md border p-3'>
                <Label>Status</Label>
                <Select
                  value={draft.status || ANY_VALUE}
                  onValueChange={(value) =>
                    updateDraft((current) => ({
                      ...current,
                      status: value === 'ACTIVE' || value === 'INACTIVE' ? value : '',
                    }))
                  }
                >
                  <SelectTrigger className='h-9 w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VALUE}>All statuses</SelectItem>
                    <SelectItem value='ACTIVE'>ACTIVE</SelectItem>
                    <SelectItem value='INACTIVE'>INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            ) : null}

            {draft.enabled.price ? (
              <section className='space-y-3 rounded-md border p-3'>
                <Label>Price range</Label>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='minPrice'>From</Label>
                    <Input
                      id='minPrice'
                      min={1}
                      step={1}
                      type='number'
                      value={draft.minPrice}
                      onChange={(event) =>
                        updateDraft((current) => ({ ...current, minPrice: event.target.value }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='maxPrice'>To</Label>
                    <Input
                      id='maxPrice'
                      min={1}
                      step={1}
                      type='number'
                      value={draft.maxPrice}
                      onChange={(event) =>
                        updateDraft((current) => ({ ...current, maxPrice: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <input
                    aria-label='Minimum price slider'
                    type='range'
                    min={PRICE_SLIDER_MIN}
                    max={PRICE_SLIDER_MAX}
                    step={PRICE_SLIDER_STEP}
                    value={minSliderValue}
                    onChange={(event) =>
                      handlePriceRangeChange('minPrice', Number(event.target.value))
                    }
                  />
                  <input
                    aria-label='Maximum price slider'
                    type='range'
                    min={PRICE_SLIDER_MIN}
                    max={PRICE_SLIDER_MAX}
                    step={PRICE_SLIDER_STEP}
                    value={maxSliderValue}
                    onChange={(event) =>
                      handlePriceRangeChange('maxPrice', Number(event.target.value))
                    }
                  />
                </div>
              </section>
            ) : null}

            {draft.enabled.updated ? (
              <section className='space-y-3 rounded-md border p-3'>
                <Label>Updated</Label>
                <div className='flex flex-wrap gap-2'>
                  {[
                    ['this-week', 'This week'],
                    ['last-week', 'Last week'],
                    ['this-month', 'This month'],
                    ['this-year', 'This year'],
                    ['custom', 'Custom'],
                  ].map(([preset, label]) => (
                    <Button
                      key={preset}
                      type='button'
                      size='sm'
                      variant={draft.updatedPreset === preset ? 'default' : 'outline'}
                      onClick={() => applyUpdatedPreset(preset as UpdatedPreset)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='updatedFrom'>From date</Label>
                    <Input
                      id='updatedFrom'
                      type='date'
                      value={draft.updatedFrom}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          updatedPreset: 'custom',
                          updatedFrom: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='updatedTo'>To date</Label>
                    <Input
                      id='updatedTo'
                      type='date'
                      value={draft.updatedTo}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          updatedPreset: 'custom',
                          updatedTo: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {draft.enabled.search ? (
              <section className='space-y-2 rounded-md border p-3'>
                <Label htmlFor='productSearch'>Title or description</Label>
                <Input
                  id='productSearch'
                  value={draft.q}
                  onChange={(event) =>
                    updateDraft((current) => ({ ...current, q: event.target.value }))
                  }
                />
              </section>
            ) : null}

            {draftResult.error ? (
              <p className='text-xs text-destructive'>{draftResult.error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={clearFilters}>
              Clear filters
            </Button>
            <Button type='button' onClick={applyFilters} disabled={Boolean(draftResult.error)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function createEmptyDraft(): FilterDraft {
  return {
    enabled: {
      category: false,
      status: false,
      price: false,
      updated: false,
      search: false,
    },
    categoryId: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    updatedPreset: 'custom',
    updatedFrom: '',
    updatedTo: '',
    q: '',
  }
}

function createDraftFromFilters(filters: ProductFilterParams): FilterDraft {
  return {
    enabled: {
      category: Boolean(filters.categoryId),
      status: Boolean(filters.status),
      price: filters.minPrice !== undefined || filters.maxPrice !== undefined,
      updated: Boolean(filters.updatedFrom || filters.updatedTo),
      search: Boolean(filters.q),
    },
    categoryId: filters.categoryId ?? '',
    status: filters.status ?? '',
    minPrice: filters.minPrice !== undefined ? String(filters.minPrice) : '',
    maxPrice: filters.maxPrice !== undefined ? String(filters.maxPrice) : '',
    updatedPreset: 'custom',
    updatedFrom: filters.updatedFrom ? toLocalDateInput(filters.updatedFrom) : '',
    updatedTo: filters.updatedTo ? toLocalDateInput(filters.updatedTo) : '',
    q: filters.q ?? '',
  }
}

function createFiltersFromDraft(draft: FilterDraft): DraftResult {
  const filters: ProductFilterParams = {}

  if (draft.enabled.category && draft.categoryId) {
    filters.categoryId = draft.categoryId
  }
  if (draft.enabled.status && draft.status) {
    filters.status = draft.status
  }
  if (draft.enabled.price) {
    const minPrice = draft.minPrice ? readPrice(draft.minPrice) : undefined
    const maxPrice = draft.maxPrice ? readPrice(draft.maxPrice) : undefined
    if (draft.minPrice && minPrice === undefined) {
      return { filters, error: 'Minimum price must be an integer greater than 0.' }
    }
    if (draft.maxPrice && maxPrice === undefined) {
      return { filters, error: 'Maximum price must be an integer greater than 0.' }
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return { filters, error: 'Minimum price cannot be greater than maximum price.' }
    }
    if (minPrice !== undefined) {
      filters.minPrice = minPrice
    }
    if (maxPrice !== undefined) {
      filters.maxPrice = maxPrice
    }
  }
  if (draft.enabled.updated) {
    if (draft.updatedFrom) {
      filters.updatedFrom = localDateStartIso(draft.updatedFrom)
    }
    if (draft.updatedTo) {
      filters.updatedTo = localDateEndIso(draft.updatedTo)
    }
    if (filters.updatedFrom && filters.updatedTo && filters.updatedFrom > filters.updatedTo) {
      return { filters, error: 'From date cannot be later than to date.' }
    }
  }
  if (draft.enabled.search && draft.q.trim()) {
    filters.q = draft.q.trim()
  }

  return { filters, error: null }
}

function clearSection(draft: FilterDraft, section: FilterSection, enabled: boolean): FilterDraft {
  if (enabled) {
    return draft
  }

  if (section === 'category') {
    return { ...draft, categoryId: '' }
  }
  if (section === 'status') {
    return { ...draft, status: '' }
  }
  if (section === 'price') {
    return { ...draft, minPrice: '', maxPrice: '' }
  }
  if (section === 'updated') {
    return { ...draft, updatedPreset: 'custom', updatedFrom: '', updatedTo: '' }
  }

  return { ...draft, q: '' }
}

function createFilterKey(filters: ProductFilterParams): string {
  const params = new URLSearchParams()
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.status) params.set('status', filters.status)
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.updatedFrom) params.set('updatedFrom', filters.updatedFrom)
  if (filters.updatedTo) params.set('updatedTo', filters.updatedTo)
  if (filters.q) params.set('q', filters.q)
  return params.toString()
}

function countActiveFilters(filters: ProductFilterParams): number {
  return [
    filters.categoryId,
    filters.status,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? 'price' : undefined,
    filters.updatedFrom || filters.updatedTo ? 'updated' : undefined,
    filters.q,
  ].filter((value) => value !== undefined && value !== '').length
}

function summarizeFilters(filters: ProductFilterParams, categories: Category[]): string {
  const parts: string[] = []
  if (filters.categoryId) {
    parts.push(
      categories.find((category) => category.categoryId === filters.categoryId)?.name ??
        filters.categoryId,
    )
  }
  if (filters.status) parts.push(filters.status)
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) parts.push('price range')
  if (filters.updatedFrom || filters.updatedTo) parts.push('updated range')
  if (filters.q) parts.push(`"${filters.q}"`)
  return parts.length > 0 ? parts.join(', ') : 'No active filters'
}

function readPrice(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
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

function getUpdatedPresetRange(preset: Exclude<UpdatedPreset, 'custom'>): {
  from: string
  to: string
} {
  const now = new Date()
  const start = new Date(now)
  let end = new Date(now)

  if (preset === 'this-week') {
    const day = now.getDay() || 7
    start.setDate(now.getDate() - day + 1)
    end = addDays(start, 6)
  } else if (preset === 'last-week') {
    const day = now.getDay() || 7
    start.setDate(now.getDate() - day - 6)
    end = addDays(start, 6)
  } else if (preset === 'this-month') {
    start.setDate(1)
    end.setMonth(now.getMonth() + 1, 0)
  } else {
    start.setMonth(0, 1)
    end.setMonth(11, 31)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return {
    from: toLocalDateInput(start.toISOString()),
    to: toLocalDateInput(end.toISOString()),
  }
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}
