import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  USER_PROFILE_QUERY_KEYS,
  getOwnProfile,
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
