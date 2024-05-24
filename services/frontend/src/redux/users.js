import { RTKApi } from '@/apiConnection'

const usersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getAllUsers: builder.query({
      query: () => '/users',
    }),
    getAccessGroups: builder.query({
      query: () => '/users/access_groups',
    }),
    getUser: builder.query({
      query: uid => `/users/${uid}`,
      providesTags: result => (result ? [{ type: 'Users', id: result.id }] : []),
    }),
    modifyAccessGroups: builder.mutation({
      query: ({ username, accessgroups }) => ({
        url: '/users/modifyaccess',
        method: 'POST',
        body: { username, accessgroups },
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
    getUserAccessEmailPreview: builder.query({
      query: () => '/users/email/preview',
    }),
    sendUserAccessEmail: builder.mutation({
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
  useGetAllUsersQuery,
  useGetUserQuery,
  useGetAccessGroupsQuery,
  useModifyAccessGroupsMutation,
  useAddUserUnitsMutation,
  useRemoveUserUnitsMutation,
  useGetUserAccessEmailPreviewQuery,
  useSendUserAccessEmailMutation,
  useModifyLanguageMutation,
} = usersApi
