import { callController, RTKApi } from '../apiConnection'

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

export const setFaculties = (uid, faculties) => {
  const route = `/users/${uid}/faculties`
  const data = { faculties }
  const prefix = 'SET_USER_FACULTIES_'
  return callController(route, prefix, data, 'post')
}

export const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'SET_USER_FACULTIES_ATTEMPT':
      return {
        ...state,
        setfacultypending: true,
      }
    case 'SET_USER_FACULTIES_FAILURE':
      return {
        ...state,
        setfacultypending: false,
      }
    case 'SET_USER_FACULTIES_SUCCESS':
      return {
        ...state,
        setfacultypending: false,
        data: state.data.filter(user => user.id !== action.response.id).concat(action.response),
      }
    default:
      return state
  }
}
