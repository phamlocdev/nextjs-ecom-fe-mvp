'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { confirmUserSignUp } from '@/lib/auth'
import { confirmSignUpSchema, type ConfirmSignUpValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ConfirmSignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const form = useForm<ConfirmSignUpValues>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: {
      username: searchParams.get('username') ?? '',
      confirmationCode: '',
    },
  })
  const isPending = form.formState.isSubmitting

  async function handleSubmit(values: ConfirmSignUpValues) {
    try {
      await confirmUserSignUp(values)
      toast.success('Account confirmed')
      router.push('/auth/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm account')
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Confirmation code</CardTitle>
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
              <Label htmlFor='confirmationCode'>Code</Label>
              <Input
                id='confirmationCode'
                aria-invalid={Boolean(form.formState.errors.confirmationCode)}
                {...form.register('confirmationCode')}
              />
              {form.formState.errors.confirmationCode ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.confirmationCode.message}
                </p>
              ) : null}
            </div>
            <Button type='submit' className='w-full' disabled={isPending}>
              <BadgeCheck />
              {isPending ? 'Confirming...' : 'Confirm account'}
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
