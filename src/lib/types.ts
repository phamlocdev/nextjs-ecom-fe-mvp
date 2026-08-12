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

export type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string; details?: string[] };
