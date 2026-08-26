import { apiClient } from '@/lib/api/api-client'

export type UploadTarget = 'product-image' | 'avatar'

export type PresignUploadFile = {
  fileName: string
  contentType: string
  sizeBytes: number
}

export type PresignUploadRequest = {
  target: UploadTarget
  files: PresignUploadFile[]
}

export type PresignedUploadItem = {
  imageKey: string
  url: string
  fields: Record<string, string>
}

export type PresignUploadResponse = {
  expiresInSeconds: number
  items: PresignedUploadItem[]
}

export async function presignUpload(input: PresignUploadRequest): Promise<PresignUploadResponse> {
  const response = await apiClient.post<PresignUploadResponse>('/upload/presign', input)
  return response.data
}

export async function uploadWithPresignedPost(
  file: File,
  presignedUpload: PresignedUploadItem,
): Promise<void> {
  const formData = new FormData()

  for (const [key, value] of Object.entries(presignedUpload.fields)) {
    formData.append(key, value)
  }
  formData.append('file', file)

  const response = await fetch(presignedUpload.url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`S3 upload failed with status ${response.status}.`)
  }
}
