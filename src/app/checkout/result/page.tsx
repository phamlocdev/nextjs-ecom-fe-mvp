import Link from 'next/link'

export default function CheckoutResultPage() {
  return (
    <div className='mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-8 text-center'>
      <h1 className='text-2xl font-semibold tracking-normal'>Continue in Orders</h1>
      <p className='text-sm text-muted-foreground'>
        Checkout now redirects through the async order flow. Open your latest order to continue to
        payment.
      </p>
      <div className='flex justify-center gap-3'>
        <Link href='/orders' className='text-sm font-medium text-primary hover:underline'>
          Go to orders
        </Link>
        <Link href='/checkout' className='text-sm font-medium text-primary hover:underline'>
          Back to checkout
        </Link>
      </div>
    </div>
  )
}
