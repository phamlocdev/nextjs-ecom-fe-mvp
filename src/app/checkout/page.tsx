'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CartLineItems } from '@/components/customer/cart-line-items'
import { ResourceError } from '@/components/resource-error'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveCart } from '@/hooks/use-active-cart'
import { useCartProductDetails } from '@/hooks/use-cart-product-details'
import { useCartQuery } from '@/hooks/use-carts'
import { useOrdersQuery, usePlaceOrderMutation } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { formatVnd } from '@/lib/format'

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { activeCartId, isHydrated: isCartHydrated, clearActiveCart } = useActiveCart()
  const cartResult = useCartQuery(activeCartId, isAuthenticated && isCartHydrated)
  const placeOrderMutation = usePlaceOrderMutation()
  const cartError = cartResult.error ? toApiClientError(cartResult.error) : null
  const { items, totalAmount, isLoading: isProductsLoading, error: cartProductsError } =
    useCartProductDetails(cartResult.data)

  useEffect(() => {
    if (cartError?.statusCode === 404) {
      clearActiveCart()
    }
  }, [cartError?.statusCode, clearActiveCart])

  if (isHydrating || !isCartHydrated) {
    return <CheckoutSkeleton />
  }

  if (!isAuthenticated) {
    return <CheckoutSkeleton />
  }

  if (!activeCartId) {
    return <CheckoutEmptyState />
  }

  if (cartError && cartError.statusCode !== 404) {
    return (
      <ResourceError title='Checkout cart error' message={cartError.message} details={cartError.details} />
    )
  }

  if (cartResult.isLoading || isProductsLoading) {
    return <CheckoutSkeleton />
  }

  if (cartProductsError) {
    const normalized = toApiClientError(cartProductsError)
    return (
      <ResourceError
        title='Checkout products error'
        message={normalized.message}
        details={normalized.details}
      />
    )
  }

  if (!cartResult.data || items.length === 0) {
    return <CheckoutEmptyState />
  }

  async function handlePlaceOrder() {
    if (!activeCartId) {
      return
    }

    try {
      const response = await placeOrderMutation.mutateAsync(activeCartId)
      toast.success('Order request accepted. We are preparing your checkout.')
      router.push(`/orders/${encodeURIComponent(response.orderId)}`)
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
      <section className='space-y-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Checkout</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Place the order first, then continue to the payment-mocking step.
          </p>
        </div>
        <CartLineItems
          items={items}
          isPending
          onDecrease={() => {}}
          onIncrease={() => {}}
          onRemove={() => {}}
        />
      </section>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Items</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className='flex items-center justify-between text-base font-semibold'>
              <span>Total</span>
              <span>{formatVnd(totalAmount)}</span>
            </div>
          </CardContent>
          <CardFooter className='flex-col gap-3'>
            <Button
              type='button'
              className='w-full'
              disabled={placeOrderMutation.isLoading}
              onClick={() => void handlePlaceOrder()}
            >
              {placeOrderMutation.isLoading ? 'Submitting order...' : 'Place order'}
            </Button>
            <Link href='/cart' className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
              Back to cart
            </Link>
          </CardFooter>
        </Card>
      </aside>
    </div>
  )
}

function CheckoutEmptyState() {
  return (
    <div className='mx-auto max-w-xl rounded-xl border bg-card p-10 text-center'>
      <h1 className='text-xl font-semibold'>Nothing to checkout</h1>
      <p className='mt-2 text-sm text-muted-foreground'>
        Your active cart is empty. Add products first.
      </p>
      <Link href='/' className={buttonVariants({ className: 'mt-6' })}>
        Browse products
      </Link>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
      <div className='space-y-4'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-32 w-full' />
      </div>
      <Skeleton className='h-56 w-full' />
    </div>
  )
}
