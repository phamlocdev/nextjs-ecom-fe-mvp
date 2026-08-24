import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  USER_QUERY_KEYS,
  findAllUsers,
  findMe,
  updateMe,
  updateUserProfile,
  updateUserRoles,
} from '@/lib/api/users'

export function useUsersQuery() {
  return useQuery(USER_QUERY_KEYS.lists(), findAllUsers)
}

export function useMeQuery() {
  return useQuery(USER_QUERY_KEYS.me(), findMe)
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient()

  return useMutation(updateMe, {
    onSuccess: () => {
      void queryClient.invalidateQueries(USER_QUERY_KEYS.me())
      void queryClient.invalidateQueries(USER_QUERY_KEYS.lists())
    },
  })
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ sub, input }: { sub: string; input: { name?: string; avatarKey?: string } }) =>
      updateUserProfile(sub, input),
    {
      onSuccess: (user) => {
        void queryClient.invalidateQueries(USER_QUERY_KEYS.lists())
        if (user.sub) {
          void queryClient.invalidateQueries(USER_QUERY_KEYS.detail(user.sub))
        }
      },
    },
  )
}

export function useUpdateUserRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ sub, groups }: { sub: string; groups: string[] }) => updateUserRoles(sub, groups),
    {
      onSuccess: () => {
        void queryClient.invalidateQueries(USER_QUERY_KEYS.lists())
      },
    },
  )
}
