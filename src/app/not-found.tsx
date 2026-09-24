import Link from 'next/link'
import { LogIn, SearchX, ShoppingBag } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <section className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center py-10'>
      <div className='w-full rounded-md border bg-card p-6 text-card-foreground shadow-sm sm:p-8'>
        <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
          <div className='flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
            <SearchX className='size-6' />
          </div>

          <div className='min-w-0 flex-1 space-y-5'>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-primary'>404</p>
              <h1 className='text-2xl font-semibold tracking-normal sm:text-3xl'>Page not found</h1>
              <p className='max-w-xl text-sm leading-6 text-muted-foreground'>
                The page you are looking for does not exist, may have moved, or is no longer
                available.
              </p>
            </div>

            <div className='flex flex-col gap-2 sm:flex-row'>
              <Link href='/' className={cn(buttonVariants({ className: 'w-full sm:w-auto' }))}>
                <ShoppingBag />
                Browse catalog
              </Link>
              <Link
                href='/auth/login'
                className={cn(
                  buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' }),
                )}
              >
                <LogIn />
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
