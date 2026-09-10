import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  USER_PROFILE_QUERY_KEYS,
  findAllUsers,
  getUserEmailStatistics,
  getOwnProfile,
  resendFailedWelcomeEmail,
  updateOwnProfile,
  type UpdateUserProfileInput,
} from '@/lib/api/users'

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

export function useUsersQuery() {
  return useQuery(USER_PROFILE_QUERY_KEYS.list(), findAllUsers)
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
