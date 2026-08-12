import "server-only";

import type { ApiErrorPayload, Category, Product } from "@/lib/types";

const API_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";

export class BackendApiError extends Error {
  status: number;
  details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.details = details;
  }
}

function normalizeApiError(status: number, payload: ApiErrorPayload | null): BackendApiError {
  if (!payload) {
    return new BackendApiError(status, `Backend returned HTTP ${status}`);
  }

  const details = Array.isArray(payload.message) ? payload.message : [];
  const message =
    typeof payload.message === "string"
      ? payload.message
      : payload.error ?? details[0] ?? `Backend returned HTTP ${status}`;

  return new BackendApiError(status, message, details);
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new BackendApiError(0, "Cannot reach backend API at http://localhost:8000");
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw normalizeApiError(response.status, payload as ApiErrorPayload | null);
  }

  return payload as T;
}

export function getBackendBaseUrl(): string {
  return API_BASE_URL;
}

export async function listProducts(): Promise<Product[]> {
  return request<Product[]>("/products");
}

export async function getProduct(productId: string): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(productId)}`);
}

export async function createProduct(payload: Omit<Product, "productId" | "currency" | "createdAt" | "updatedAt">): Promise<Product> {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  productId: string,
  payload: Partial<Omit<Product, "productId" | "currency" | "createdAt" | "updatedAt">>
): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await request<void>(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function listCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export async function getCategory(categoryId: string): Promise<Category> {
  return request<Category>(`/categories/${encodeURIComponent(categoryId)}`);
}

export async function createCategory(payload: Pick<Category, "categoryId" | "name" | "description">): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  categoryId: string,
  payload: Partial<Pick<Category, "name" | "description">>
): Promise<Category> {
  return request<Category>(`/categories/${encodeURIComponent(categoryId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await request<void>(`/categories/${encodeURIComponent(categoryId)}`, {
    method: "DELETE",
  });
}
