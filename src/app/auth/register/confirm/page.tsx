import Link from 'next/link'
import { MailCheck, RotateCw } from 'lucide-react'
import {
  confirmRegistrationAction,
  resendRegistrationCodeAction,
} from '../actions'
import { normalizeReturnTo } from '@/lib/auth/server'

export default async function ConfirmRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const username = firstValue(resolved.username)
  const error = firstValue(resolved.error)
  const message = firstValue(resolved.message)
  const returnTo = normalizeReturnTo(firstValue(resolved.returnTo))

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='w-full max-w-lg rounded-3xl border bg-card p-6 shadow-sm sm:p-8'>
        <div className='flex items-center gap-3'>
          <div className='flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <MailCheck className='size-5' />
          </div>
          <div>
            <p className='text-sm uppercase tracking-[0.2em] text-muted-foreground'>Confirm sign-up</p>
            <h1 className='text-2xl font-semibold'>Enter your verification code</h1>
          </div>
        </div>

        <p className='mt-4 text-sm text-muted-foreground'>
          Cognito sends a confirmation code to the email address tied to{' '}
          <span className='font-medium text-foreground'>{username || 'your account'}</span>.
        </p>

        {error ? (
          <div className='mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}
        {message ? (
          <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
            {message}
          </div>
        ) : null}

        <form action={confirmRegistrationAction} className='mt-6 rounded-2xl border p-5'>
          <input type='hidden' name='username' value={username} />
          <input type='hidden' name='returnTo' value={returnTo} />
          <label className='block space-y-1'>
            <span className='text-sm font-medium'>Confirmation code</span>
            <input
              name='code'
              autoComplete='one-time-code'
              className='h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary'
            />
          </label>
          <button
            type='submit'
            className='mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90'
          >
            Confirm account
          </button>
        </form>

        <form action={resendRegistrationCodeAction} className='mt-4'>
          <input type='hidden' name='username' value={username} />
          <input type='hidden' name='returnTo' value={returnTo} />
          <button
            type='submit'
            className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted'
          >
            <RotateCw className='size-4' />
            Resend code
          </button>
        </form>

        <div className='mt-4 flex justify-between gap-3 text-sm'>
          <Link
            href={`/auth/register?returnTo=${encodeURIComponent(returnTo)}`}
            className='text-muted-foreground transition-colors hover:text-foreground'
          >
            Back to registration
          </Link>
          <Link
            href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
            className='text-muted-foreground transition-colors hover:text-foreground'
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}
