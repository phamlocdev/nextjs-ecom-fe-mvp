'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Globe, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { redirectToGoogle, signInWithPassword } from '@/lib/auth'
import { signInSchema, type SignInValues } from '@/lib/schemas'
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
  const next = searchParams.get('next') || '/'
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })
  const isPending = form.formState.isSubmitting

  async function handleSubmit(values: SignInValues) {
    try {
      await signInWithPassword(values)
      await hydrate(true)
      router.push(next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign in')
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
    <AuthPageFrame title='Sign in'>
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
