export type ProductStatus = 'ACTIVE' | 'INACTIVE'
export type CartStatus = 'ACTIVE' | 'EXPIRED'
export type OrderStatus = 'PENDING' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'FAILED' | 'EXPIRED'
export type PaymentStatus = 'NOT_STARTED' | 'PROCESSING' | 'PAID' | 'FAILED'
export type InventoryStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export type Product = {
  productId: string
  name: string
  description: string
  categoryId: string
  price: number
  currency: string
  images?: ProductImage[]
  imageUrl?: string
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type ProductImage = {
  imageKey: string
  alt?: string
  sortOrder: number
  isPrimary: boolean
  readUrl?: string
}

export type InventoryRecord = {
  productId: string
  availableQuantity: number
  reservedQuantity: number
  updatedAt: string
}

export type InventorySummary = InventoryRecord & {
  productName: string
  categoryId: string
  imageUrl?: string
  productStatus: ProductStatus
}

export type Category = {
  categoryId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export type Cart = {
  customerId: string
  cartId: string
  status: CartStatus
  createdAt: string
  updatedAt: string
  expiresAt: number
}

export type CartItem = {
  cartId: string
  customerId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export type CartDetails = Cart & {
  items: CartItem[]
}

export type Order = {
  orderId: string
  customerId: string
  customerEmail?: string
  customerName?: string
  cartId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
  reservedAt?: string
  paymentExpiresAt?: number
  paymentRequestedAt?: string
  paidAt?: string
  paymentTransactionId?: string
  paymentFailureReason?: string
  failureReason?: string
  totalAmount?: number
}

export type OrderItem = {
  lineId: string
  orderId: string
  productId: string
  productName: string
  imageUrl?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  createdAt: string
}

export type OrderDetails = Order & {
  items: OrderItem[]
}

export type PlaceOrderResponse = {
  orderId: string
  status: OrderStatus
}

export type TriggerPaymentResponse = {
  orderId: string
  paymentStatus: PaymentStatus
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 10

export type PaginationParams = {
  limit?: PageSize
  cursor?: string
  categoryId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  updatedFrom?: string
  updatedTo?: string
  q?: string
}

export type ProductFilterParams = Omit<PaginationParams, 'limit' | 'cursor'>
export type InventoryPaginationParams = Pick<
  PaginationParams,
  'limit' | 'cursor' | 'status' | 'q'
> & {
  productIds?: string[]
}

export type PaginatedResponse<T> = {
  items: T[]
  previousCursor: string | null
  nextCursor: string | null
  limit: PageSize
  currentPage: number
  scannedCount?: number
}

export type ApiErrorPayload = {
  statusCode?: number
  message?: string | string[]
  error?: string
}

export type ManagedUser = {
  username: string
  enabled: boolean
  status?: string
  name?: string
  sub?: string
  email?: string
  emailVerified: boolean
  groups: string[]
  profile?: UserProfile
  createdAt?: string
  updatedAt?: string
}

export type UserProfile = {
  sub: string
  username: string
  email?: string
  name?: string
  avatarKey?: string
  avatarReadUrl?: string
  createdAt: string
  updatedAt: string
}

export type CustomerProfile = {
  username: string
  email?: string
  name?: string
  sub?: string
  avatarKey?: string
  avatarReadUrl?: string
}
