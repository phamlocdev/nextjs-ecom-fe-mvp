import { apiClient } from '@/lib/api/api-client'
import type {
  EmailDeliveryStatistics,
  EmailTracking,
  ManagedUser,
  ResendEmailResult,
  UserProfile,
} from '@/lib/types'

export const USER_PROFILE_QUERY_KEYS = {
  all: ['users'] as const,
  me: () => [...USER_PROFILE_QUERY_KEYS.all, 'me'] as const,
  profile: () => [...USER_PROFILE_QUERY_KEYS.me(), 'profile'] as const,
  list: () => [...USER_PROFILE_QUERY_KEYS.all, 'list'] as const,
  emailStatistics: () => [...USER_PROFILE_QUERY_KEYS.all, 'email-statistics'] as const,
  emailTracking: (userId: string) =>
    [...USER_PROFILE_QUERY_KEYS.all, 'email-tracking', userId] as const,
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

export async function findAllUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>('/users')
  return response.data
}

export async function getUserEmailStatistics(): Promise<EmailDeliveryStatistics> {
  const response = await apiClient.get<EmailDeliveryStatistics>('/users', {
    params: { emailStatistics: 'true' },
  })
  return response.data
}

export async function getUserEmailTracking(userId: string): Promise<EmailTracking[]> {
  const response = await apiClient.get<EmailTracking[]>(`/users/${userId}/email-tracking`)
  return response.data
}

export async function resendFailedWelcomeEmail(
  userId: string,
  recipientEmail: string,
): Promise<ResendEmailResult> {
  const response = await apiClient.post<ResendEmailResult>(
    `/users/${userId}/emails/welcome-new-customer/resend-failed`,
    { recipientEmail },
  )
  return response.data
}
