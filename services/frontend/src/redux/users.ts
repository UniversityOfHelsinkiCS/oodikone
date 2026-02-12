import { RTKApi } from '@/apiConnection'
import { Email, User } from '@/types/api/users'
import { Role } from '@oodikone/shared/types'

const usersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getAllUsers: builder.query<User[], void>({
      query: () => '/users',
    }),
    getRoles: builder.query<Role[], void>({
      query: () => '/users/roles',
    }),
    getUser: builder.query<User, string>({
      query: uid => `/users/${uid}`,
      providesTags: result => (result ? [{ type: 'Users', id: result.id }] : []),
    }),
    modifyRoles: builder.mutation<void, { username: string; roles: Record<Role, boolean> }>({
      query: ({ username, roles }) => ({
        url: '/users/modify-roles',
        method: 'POST',
        body: { username, roles },
      }),
      invalidatesTags: ['Users'],
    }),
    addUserUnits: builder.mutation({
      query: ({ uid, codes }) => ({
        url: `/users/${uid}/elements`,
        method: 'POST',
        body: { codes },
      }),
      invalidatesTags: ['Users'],
    }),
    removeUserUnits: builder.mutation({
      query: ({ uid, codes }) => ({
        url: `/users/${uid}/elements`,
        method: 'DELETE',
        body: { codes },
      }),
      invalidatesTags: ['Users'],
    }),
    getUserAccessEmailPreview: builder.query<Email, void>({
      query: () => '/users/email/preview',
    }),
    sendUserAccessEmail: builder.mutation<void, string>({
      query: recipientAddress => ({
        url: '/users/email',
        method: 'POST',
        body: { email: recipientAddress },
      }),
    }),
    modifyLanguage: builder.mutation({
      query: ({ language }) => ({
        url: '/users/language',
        method: 'POST',
        body: { language },
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetUserQuery,
  useGetRolesQuery,
  useLazyGetAllUsersQuery,
  useModifyRolesMutation,
  useAddUserUnitsMutation,
  useRemoveUserUnitsMutation,
  useGetUserAccessEmailPreviewQuery,
  useSendUserAccessEmailMutation,
  useModifyLanguageMutation,
} = usersApi
