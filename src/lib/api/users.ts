import { apiClient } from '@/lib/api/api-client'
import type { CustomerProfile, ManagedUser } from '@/lib/types'

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_QUERY_KEYS.all, 'list'] as const,
  detail: (sub: string) => [...USER_QUERY_KEYS.all, 'detail', sub] as const,
  me: () => [...USER_QUERY_KEYS.all, 'me'] as const,
}

export async function findAllUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>('/users')
  return response.data
}

export async function updateUserProfile(
  sub: string,
  input: { name?: string; avatarKey?: string },
): Promise<ManagedUser> {
  const response = await apiClient.patch<ManagedUser>(`/users/${sub}`, input)
  return response.data
}

export async function updateUserRoles(sub: string, groups: string[]): Promise<ManagedUser> {
  const response = await apiClient.patch<ManagedUser>(`/users/${sub}/roles`, { groups })
  return response.data
}

export async function findMe(): Promise<CustomerProfile> {
  const response = await apiClient.get<CustomerProfile>('/me')
  return response.data
}

export async function updateMe(input: {
  name?: string
  avatarKey?: string
}): Promise<CustomerProfile> {
  const response = await apiClient.patch<CustomerProfile>('/me', input)
  return response.data
}
