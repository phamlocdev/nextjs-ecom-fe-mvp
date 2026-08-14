import Link from 'next/link'
import { ArrowRight, UserPlus } from 'lucide-react'
import { registerWithPasswordAction } from './actions'
import { normalizeReturnTo } from '@/lib/auth/server'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const error = firstValue(resolved.error)
  const returnTo = normalizeReturnTo(firstValue(resolved.returnTo))

  return (
    <div className='grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]'>
      <section className='hidden bg-[linear-gradient(160deg,_#0f172a_0%,_#1d4ed8_45%,_#0f766e_100%)] px-12 py-14 text-white lg:flex lg:flex-col'>
        <div className='max-w-lg'>
          <p className='rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70'>
            Customer sign-up
          </p>
          <h1 className='mt-8 text-5xl font-semibold leading-tight'>
            Create a Cognito account and drop new users into the `customer` role automatically.
          </h1>
          <p className='mt-6 text-base text-white/72'>
            New sign-ups confirm their email, trigger a post-confirmation hook, and can then use
            the same login flows as every other user in the system.
          </p>
        </div>
      </section>

      <section className='flex items-center justify-center bg-background px-4 py-10 sm:px-6 lg:px-8'>
        <div className='w-full max-w-xl rounded-3xl border bg-card p-6 shadow-sm sm:p-8'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-sm uppercase tracking-[0.2em] text-muted-foreground'>Register</p>
              <h2 className='mt-2 text-3xl font-semibold'>Create a new account</h2>
              <p className='mt-3 text-sm text-muted-foreground'>
                This path uses Cognito `SignUp`, then confirms the account before first login.
              </p>
            </div>
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
              className='rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted'
            >
              Sign in
            </Link>
          </div>

          {error ? (
            <div className='mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          ) : null}

          <form action={registerWithPasswordAction} className='mt-6 rounded-2xl border p-5'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <UserPlus className='size-4 text-primary' />
              Self-service registration
            </div>
            <input type='hidden' name='returnTo' value={returnTo} />
            <div className='mt-5 grid gap-3'>
              <label className='block space-y-1'>
                <span className='text-sm font-medium'>Username</span>
                <input
                  name='username'
                  autoComplete='username'
                  className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
                />
              </label>
              <label className='block space-y-1'>
                <span className='text-sm font-medium'>Email</span>
                <input
                  name='email'
                  type='email'
                  autoComplete='email'
                  className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
                />
              </label>
              <label className='block space-y-1'>
                <span className='text-sm font-medium'>Password</span>
                <input
                  name='password'
                  type='password'
                  autoComplete='new-password'
                  className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
                />
              </label>
              <label className='block space-y-1'>
                <span className='text-sm font-medium'>Confirm password</span>
                <input
                  name='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
                />
              </label>
            </div>
            <button
              type='submit'
              className='mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90'
            >
              Create account
              <ArrowRight className='size-4' />
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}
