export type ProductStatus = "ACTIVE" | "INACTIVE";

export type Product = {
  productId: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  currency: string;
  imageUrl?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  categoryId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

export type PaginationParams = {
  limit?: PageSize;
  cursor?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  previousCursor: string | null;
  nextCursor: string | null;
  limit: PageSize;
  currentPage: number;
};

export type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string; details?: string[] };
