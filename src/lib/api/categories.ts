import { apiClient } from '@/lib/api/api-client'
import type { CategoryCreateValues, CategoryUpdateValues } from '@/lib/schemas'
import type { Category, PaginationParams, PaginatedResponse } from '@/lib/types'

export type FindAllCategoriesQueryParams = Pick<PaginationParams, 'limit' | 'cursor'>

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: (params?: FindAllCategoriesQueryParams) =>
    [...CATEGORY_QUERY_KEYS.lists(), params] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
}

export async function findAllCategories(
  params?: FindAllCategoriesQueryParams,
): Promise<PaginatedResponse<Category>> {
  const response = await apiClient.get<PaginatedResponse<Category>>('/categories', { params })
  return response.data
}

export async function findCategoryById(categoryId: string): Promise<Category> {
  const response = await apiClient.get<Category>(`/categories/${categoryId}`)
  return response.data
}

export async function createCategory(input: CategoryCreateValues): Promise<Category> {
  const response = await apiClient.post<Category>('/categories', input)
  return response.data
}

export async function updateCategory(
  categoryId: string,
  input: CategoryUpdateValues,
): Promise<Category> {
  const response = await apiClient.patch<Category>(`/categories/${categoryId}`, input)
  return response.data
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await apiClient.delete(`/categories/${categoryId}`)
}
