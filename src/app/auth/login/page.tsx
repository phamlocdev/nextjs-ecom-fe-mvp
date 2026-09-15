'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Globe, KeyRound, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { completeNewPasswordChallenge, redirectToGoogle, signInWithPassword } from '@/lib/auth'
import {
  setSignInPasswordSchema,
  signInSchema,
  type SetSignInPasswordValues,
  type SignInValues,
} from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((state) => state.hydrate)
  const [newPasswordUsername, setNewPasswordUsername] = useState<string | null>(null)
  const next = searchParams.get('next') || '/'
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })
  const newPasswordForm = useForm<SetSignInPasswordValues>({
    resolver: zodResolver(setSignInPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })
  const isPending = form.formState.isSubmitting || newPasswordForm.formState.isSubmitting

  async function handleSubmit(values: SignInValues) {
    try {
      const result = await signInWithPassword(values)
      if (result.status === 'new-password-required') {
        setNewPasswordUsername(result.username)
        newPasswordForm.reset({ password: '', confirmPassword: '' })
        toast.info('Please set a new password to finish signing in.')
        return
      }

      await hydrate(true)
      router.push(next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign in')
    }
  }

  async function handleNewPasswordSubmit(values: SetSignInPasswordValues) {
    try {
      await completeNewPasswordChallenge({ newPassword: values.password })
      await hydrate(true)
      toast.success('Password updated')
      router.push(next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update password')
    }
  }

  async function handleGoogleSignIn() {
    try {
      await redirectToGoogle()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start Google login')
    }
  }

  return (
    <AuthPageFrame title={newPasswordUsername ? 'Set new password' : 'Sign in'}>
      {newPasswordUsername ? (
        <form
          className='space-y-4'
          onSubmit={newPasswordForm.handleSubmit(handleNewPasswordSubmit)}
        >
          <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground'>
            Signing in as <span className='font-medium text-foreground'>{newPasswordUsername}</span>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='newPassword'>New password</Label>
            <PasswordInput
              id='newPassword'
              autoComplete='new-password'
              aria-invalid={Boolean(newPasswordForm.formState.errors.password)}
              {...newPasswordForm.register('password')}
            />
            {newPasswordForm.formState.errors.password ? (
              <p className='text-xs text-destructive'>
                {newPasswordForm.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm password</Label>
            <PasswordInput
              id='confirmPassword'
              autoComplete='new-password'
              aria-invalid={Boolean(newPasswordForm.formState.errors.confirmPassword)}
              {...newPasswordForm.register('confirmPassword')}
            />
            {newPasswordForm.formState.errors.confirmPassword ? (
              <p className='text-xs text-destructive'>
                {newPasswordForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          <Button type='submit' className='w-full' disabled={isPending}>
            <KeyRound />
            {isPending ? 'Updating...' : 'Update password'}
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='w-full'
            onClick={() => setNewPasswordUsername(null)}
            disabled={isPending}
          >
            Back to sign in
          </Button>
        </form>
      ) : (
        <>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <div className='space-y-2'>
              <Label htmlFor='username'>Email or username</Label>
              <Input
                id='username'
                autoComplete='username'
                aria-invalid={Boolean(form.formState.errors.username)}
                {...form.register('username')}
              />
              {form.formState.errors.username ? (
                <p className='text-xs text-destructive'>{form.formState.errors.username.message}</p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <PasswordInput
                id='password'
                autoComplete='current-password'
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className='text-xs text-destructive'>{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button type='submit' className='w-full' disabled={isPending}>
              <LogIn />
              {isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <Button type='button' variant='outline' className='w-full' onClick={handleGoogleSignIn}>
            <Globe />
            Continue with Google
          </Button>

          <div className='flex justify-between text-sm'>
            <Link href='/auth/signup' className='text-primary hover:underline'>
              Sign up
            </Link>
            <Link href='/auth/forgot-password' className='text-primary hover:underline'>
              Forgot password?
            </Link>
          </div>
        </>
      )}
    </AuthPageFrame>
  )
}

function AuthPageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>{children}</CardContent>
      </Card>
    </div>
  )
}
