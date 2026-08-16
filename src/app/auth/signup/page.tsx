'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { signUpWithEmail } from '@/lib/auth'
import { signUpSchema, type SignUpInput, type SignUpValues } from '@/lib/schemas'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const router = useRouter()
  const form = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
  const isPending = form.formState.isSubmitting

  async function handleSubmit(values: SignUpValues) {
    try {
      await signUpWithEmail({
        username: values.username,
        email: values.email,
        password: values.password,
      })
      toast.success('Confirmation code sent')
      router.push(`/auth/confirm?username=${encodeURIComponent(values.username)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign up')
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
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
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className='text-xs text-destructive'>{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <PasswordInput
                id='password'
                autoComplete='new-password'
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className='text-xs text-destructive'>{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm password</Label>
              <PasswordInput
                id='confirmPassword'
                autoComplete='new-password'
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <Button type='submit' className='w-full' disabled={isPending}>
              <UserPlus />
              {isPending ? 'Creating...' : 'Sign up'}
            </Button>
          </form>
          <Link href='/auth/login' className='block text-sm text-primary hover:underline'>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
