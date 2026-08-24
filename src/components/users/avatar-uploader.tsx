'use client'

import { useRef, useState } from 'react'
import { Camera, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createPresignedUploads, uploadFileToPresignedUrl } from '@/lib/api/uploads'

export function AvatarUploader({
  avatarUrl,
  onAvatarKeyChange,
}: {
  avatarUrl?: string
  onAvatarKeyChange: (avatarKey: string, previewUrl: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(avatarUrl)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      setIsUploading(true)
      const presignResponse = await createPresignedUploads({
        scope: 'USER_AVATAR',
        files: [{ fileName: file.name, contentType: file.type, sizeBytes: file.size }],
      })
      const upload = presignResponse.uploads[0]
      await uploadFileToPresignedUrl(upload, file)
      const nextPreviewUrl = URL.createObjectURL(file)
      setPreviewUrl(nextPreviewUrl)
      onAvatarKeyChange(upload.objectKey, nextPreviewUrl)
      toast.success('Avatar uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload avatar')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className='flex items-center gap-3'>
      <div className='flex size-14 items-center justify-center overflow-hidden rounded-full border bg-muted'>
        {previewUrl ? (
          <img src={previewUrl} alt='' className='h-full w-full object-cover' />
        ) : (
          <UserRound className='size-7 text-muted-foreground' />
        )}
      </div>
      <Input
        ref={fileInputRef}
        className='hidden'
        type='file'
        accept='image/jpeg,image/png,image/webp'
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Camera />
        {isUploading ? 'Uploading...' : 'Avatar'}
      </Button>
    </div>
  )
}
