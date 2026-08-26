'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateUserProfileMutation, useUserProfileQuery } from '@/hooks/use-user-profile'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { presignUpload, uploadWithPresignedPost } from '@/lib/api/upload'
import {
  userProfileFormSchema,
  type UserProfileFormInput,
  type UserProfileFormValues,
} from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'

export function UserProfileForm({ title }: { title: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileResult = useUserProfileQuery()
  const updateProfileMutation = useUpdateUserProfileMutation()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const profile = profileResult.data
  const profileError = profileResult.error ? toApiClientError(profileResult.error) : null
  const isPending = updateProfileMutation.isLoading || isUploading

  const form = useForm<UserProfileFormInput, unknown, UserProfileFormValues>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    form.reset({ name: profile?.name ?? '' })
  }, [form, profile])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  function handleAvatarSelected(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) {
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreviewUrl(nextPreviewUrl)
    setRemoveAvatar(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setRemoveAvatar(true)
  }

  async function onSubmit(values: UserProfileFormValues) {
    try {
      setIsUploading(true)
      let avatarKey: string | null | undefined

      if (avatarFile) {
        const presigned = await presignUpload({
          target: 'avatar',
          files: [
            {
              fileName: avatarFile.name,
              contentType: avatarFile.type,
              sizeBytes: avatarFile.size,
            },
          ],
        })
        const upload = presigned.items[0]
        await uploadWithPresignedPost(avatarFile, upload)
        avatarKey = upload.imageKey
      } else if (removeAvatar) {
        avatarKey = null
      }

      await updateProfileMutation.mutateAsync({
        name: values.name,
        ...(avatarKey !== undefined ? { avatarKey } : {}),
      })

      setAvatarFile(null)
      setAvatarPreviewUrl(null)
      setRemoveAvatar(false)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    } finally {
      setIsUploading(false)
    }
  }

  if (profileResult.isLoading) {
    return <Skeleton className='h-96 w-full' />
  }

  if (profileError) {
    return (
      <ResourceError
        title='Profile endpoint error'
        message={profileError.message}
        details={profileError.details}
      />
    )
  }

  const avatarSrc = removeAvatar ? null : (avatarPreviewUrl ?? profile?.avatarReadUrl)

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>{title}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Manage your account profile.</p>
      </div>

      <form
        className='grid gap-6 rounded-md border bg-card p-4'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <section className='grid gap-4 sm:grid-cols-[160px_1fr]'>
          <div className='space-y-3'>
            <div className='aspect-square overflow-hidden rounded-md border bg-muted'>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile?.name || profile?.username || 'User avatar'}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
                  No avatar
                </div>
              )}
            </div>
            <div className='flex gap-2'>
              <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
                <ImagePlus />
                Upload
              </Button>
              <Button type='button' variant='destructive' onClick={handleRemoveAvatar}>
                <Trash2 />
                Remove
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='hidden'
              onChange={(event) => handleAvatarSelected(event.target.files)}
            />
          </div>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input id='username' value={profile?.username ?? ''} readOnly />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' value={profile?.email ?? ''} readOnly />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p className='text-xs text-destructive'>{form.formState.errors.name.message}</p>
              ) : null}
            </div>
          </div>
        </section>

        <div className='flex justify-end'>
          <Button type='submit' disabled={isPending}>
            <Save />
            {isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}
