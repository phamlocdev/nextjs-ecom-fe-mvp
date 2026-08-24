import { apiClient } from '@/lib/api/api-client'

export type UploadScope = 'PRODUCT_IMAGE' | 'USER_AVATAR'

export type PresignUploadFile = {
  fileName: string
  contentType: string
  sizeBytes: number
}

export type PresignedUpload = {
  fileName: string
  contentType: string
  objectKey: string
  uploadUrl: string
  headers: Record<string, string>
  expiresAt: string
}

export type CreatePresignedUploadsResponse = {
  uploadSessionId?: string
  uploads: PresignedUpload[]
}

export async function createPresignedUploads(input: {
  scope: UploadScope
  files: PresignUploadFile[]
  uploadSessionId?: string
}): Promise<CreatePresignedUploadsResponse> {
  const response = await apiClient.post<CreatePresignedUploadsResponse>('/uploads/presign', input)
  return response.data
}

export async function uploadFileToPresignedUrl(upload: PresignedUpload, file: File): Promise<void> {
  const response = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }
}
