import { RTKApi } from '../apiConnection'

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
    }),
    modifyAccessGroups: builder.mutation({
      query: ({ username, accessgroups }) => ({
        url: '/users/modifyaccess',
        method: 'POST',
        body: { username, accessgroups },
      }),
    }),
    addUserUnits: builder.mutation({
      query: ({ uid, codes }) => ({
        url: `/users/${uid}/elements`,
        method: 'POST',
        body: { codes },
      }),
    }),
    removeUserUnits: builder.mutation({
      query: ({ uid, codes }) => ({
        url: `/users/${uid}/elements`,
        method: 'DELETE',
        body: { codes },
      }),
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
} = usersApi
