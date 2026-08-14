import Link from 'next/link'
import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react'
import { loginWithPasswordAction } from './actions'
import { normalizeReturnTo } from '@/lib/auth/server'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const error = firstValue(resolved.error)
  const returnTo = normalizeReturnTo(firstValue(resolved.returnTo))

  return (
    <div className='grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]'>
      <section className='hidden bg-[linear-gradient(160deg,_#111827_0%,_#1f2937_45%,_#92400e_100%)] px-12 py-14 text-white lg:flex lg:flex-col'>
        <div className='max-w-lg'>
          <p className='rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70'>
            DynamoDB MVP
          </p>
          <h1 className='mt-8 text-5xl font-semibold leading-tight'>
            Custom sign-in for the admin workspace.
          </h1>
          <p className='mt-6 text-base text-white/72'>
            Use the direct username and password flow for day-to-day local testing, with the Hosted
            UI path available as a secondary option when you want to validate redirects.
          </p>
        </div>
        <div className='mt-auto rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur'>
          <p className='text-sm font-medium'>What this environment supports</p>
          <ul className='mt-4 space-y-3 text-sm text-white/75'>
            <li>Server-side session cookies with refresh-token rotation</li>
            <li>API Gateway JWT verification for protected admin mutations</li>
            <li>NestJS role checks for `manager` and `admin` authorization</li>
          </ul>
        </div>
      </section>

      <section className='flex items-center justify-center bg-background px-4 py-10 sm:px-6 lg:px-8'>
        <div className='w-full max-w-lg rounded-3xl border bg-card p-6 shadow-sm sm:p-8'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-sm uppercase tracking-[0.2em] text-muted-foreground'>
                Admin sign in
              </p>
              <h2 className='mt-2 text-3xl font-semibold'>Sign in with your account</h2>
              <p className='mt-3 text-sm text-muted-foreground'>
                This form goes through the server-managed custom auth flow and creates the same
                protected session used across the admin area.
              </p>
            </div>
            <Link
              href='/customer/products'
              className='rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted'
            >
              Catalog
            </Link>
          </div>

          {error ? (
            <div className='mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          ) : null}

          <form action={loginWithPasswordAction} className='mt-6 rounded-2xl border p-5 sm:p-6'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <UserRound className='size-4 text-primary' />
              Custom mode
            </div>
            <p className='mt-2 text-sm text-muted-foreground'>
              Username/password flow executed by Next.js on the server.
            </p>
            <input type='hidden' name='returnTo' value={returnTo} />
            <div className='mt-5 space-y-4'>
              <label className='block space-y-1.5'>
                <span className='text-sm font-medium'>Username or email</span>
                <input
                  name='username'
                  autoComplete='username'
                  className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className='text-sm font-medium'>Password</span>
                <input
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
                />
              </label>
            </div>
            <button
              type='submit'
              className='mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90'
            >
              <LockKeyhole className='size-4' />
              Sign in
            </button>
            <Link
              href={`/auth/register?returnTo=${encodeURIComponent(returnTo)}`}
              className='mt-4 inline-flex w-full items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              Create a new account
            </Link>
            <div className='mt-6 flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3'>
              <div>
                <p className='text-sm font-medium'>Need Hosted UI instead?</p>
                <p className='text-xs text-muted-foreground'>
                  Use the redirect-based Cognito flow for OAuth/PKCE testing.
                </p>
              </div>
              <Link
                href={`/auth/hosted-ui/login?returnTo=${encodeURIComponent(returnTo)}`}
                className='inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-muted'
              >
                Hosted UI
                <ArrowRight className='size-4' />
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}
