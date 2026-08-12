'use server'

import { revalidatePath } from 'next/cache'
import {
  BackendApiError,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateCategory,
  updateProduct,
} from '@/lib/api'
import { categoryCreateSchema, categoryUpdateSchema, productFormSchema } from '@/lib/schemas'
import type { ActionResult, Category, Product } from '@/lib/types'

function toActionError<T = void>(error: unknown): ActionResult<T> {
  if (error instanceof BackendApiError) {
    return { ok: false, message: error.message, details: error.details }
  }

  return { ok: false, message: 'Unexpected error. Please try again.' }
}

function revalidateAdminPages(): void {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/categories')
}

export async function createProductAction(input: unknown): Promise<ActionResult<Product>> {
  const parsed = productFormSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Invalid product data',
      details: parsed.error.issues.map((issue) => issue.message),
    }
  }

  try {
    const data = await createProduct(parsed.data)
    revalidateAdminPages()
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateProductAction(
  productId: string,
  input: unknown,
): Promise<ActionResult<Product>> {
  const parsed = productFormSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Invalid product data',
      details: parsed.error.issues.map((issue) => issue.message),
    }
  }

  try {
    const data = await updateProduct(productId, parsed.data)
    revalidateAdminPages()
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    await deleteProduct(productId)
    revalidateAdminPages()
    return { ok: true }
  } catch (error) {
    return toActionError(error)
  }
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<Category>> {
  const parsed = categoryCreateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Invalid category data',
      details: parsed.error.issues.map((issue) => issue.message),
    }
  }

  try {
    const data = await createCategory(parsed.data)
    revalidateAdminPages()
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: unknown,
): Promise<ActionResult<Category>> {
  const parsed = categoryUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Invalid category data',
      details: parsed.error.issues.map((issue) => issue.message),
    }
  }

  try {
    const data = await updateCategory(categoryId, parsed.data)
    revalidateAdminPages()
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    await deleteCategory(categoryId)
    revalidateAdminPages()
    return { ok: true }
  } catch (error) {
    return toActionError(error)
  }
}
