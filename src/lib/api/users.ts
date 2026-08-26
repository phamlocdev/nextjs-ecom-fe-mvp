import { apiClient } from '@/lib/api/api-client'
import type { UserProfile } from '@/lib/types'

export const USER_PROFILE_QUERY_KEYS = {
  all: ['users'] as const,
  me: () => [...USER_PROFILE_QUERY_KEYS.all, 'me'] as const,
  profile: () => [...USER_PROFILE_QUERY_KEYS.me(), 'profile'] as const,
}

export type UpdateUserProfileInput = {
  name?: string
  avatarKey?: string | null
}

export async function getOwnProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/users/me/profile')
  return response.data
}

export async function updateOwnProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const response = await apiClient.patch<UserProfile>('/users/me/profile', input)
  return response.data
}
