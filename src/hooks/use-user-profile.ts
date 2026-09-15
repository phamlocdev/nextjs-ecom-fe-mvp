import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  USER_PROFILE_QUERY_KEYS,
  createManagedUser,
  disableManagedUser,
  findAllUsers,
  getUserEmailStatistics,
  getOwnProfile,
  resendFailedWelcomeEmail,
  resetManagedUserPassword,
  setOwnPassword,
  updateUserPermissions,
  updateOwnProfile,
  type CreateManagedUserInput,
  type ResetManagedUserPasswordInput,
  type SetOwnPasswordInput,
  type UpdateUserProfileInput,
} from '@/lib/api/users'
import type { Permission } from '@/lib/types'

export function useUserProfileQuery() {
  return useQuery(USER_PROFILE_QUERY_KEYS.profile(), getOwnProfile)
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: UpdateUserProfileInput) => updateOwnProfile(input), {
    onSuccess: () => {
      void queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.profile())
    },
  })
}

export function useSetOwnPasswordMutation() {
  return useMutation((input: SetOwnPasswordInput) => setOwnPassword(input))
}

export function useUsersQuery() {
  return useQuery(USER_PROFILE_QUERY_KEYS.list(), findAllUsers)
}

export function useCreateManagedUserMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: CreateManagedUserInput) => createManagedUser(input), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
    },
  })
}

export function useUpdateUserPermissionsMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ userId, permissions }: { userId: string; permissions: Permission[] }) =>
      updateUserPermissions(userId, permissions),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
      },
    },
  )
}

export function useDisableManagedUserMutation() {
  const queryClient = useQueryClient()

  return useMutation((userId: string) => disableManagedUser(userId), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
    },
  })
}

export function useResetManagedUserPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ userId, input }: { userId: string; input: ResetManagedUserPasswordInput }) =>
      resetManagedUserPassword(userId, input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
      },
    },
  )
}

export function useUserEmailStatisticsQuery() {
  return useQuery(USER_PROFILE_QUERY_KEYS.emailStatistics(), getUserEmailStatistics)
}

export function useResendFailedWelcomeEmailMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ userId, recipientEmail }: { userId: string; recipientEmail: string }) =>
      resendFailedWelcomeEmail(userId, recipientEmail),
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list()),
          queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.emailStatistics()),
        ])
      },
    },
  )
}
