import { callController, RTKApi } from '../apiConnection'

const usersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getUserAccessEmailPreview: builder.query({
      query: () => '/users/email/preview',
    }),
    sendUserAccessEmail: builder.mutation({
      query: ({ recipientAddress }) => ({
        url: '/users/email',
        method: 'POST',
        body: { recipientAddress },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useGetUserAccessEmailPreviewQuery, useSendUserAccessEmailMutation } = usersApi

export const getUsers = () => {
  const route = '/users'
  const prefix = 'GET_USERS_'
  return callController(route, prefix)
}

export const modifyAccessGroups = (username, accessgroups) => {
  const route = '/users/modifyaccess'
  const prefix = 'MODIFY_ACCESSGROUPS_'
  const method = 'post'
  const data = { username, accessgroups }
  return callController(route, prefix, data, method)
}

export const addUserUnits = (uid, codes) => {
  const route = `/users/${uid}/elements`
  const data = { codes }
  const prefix = 'EDIT_USER_UNIT_'
  return callController(route, prefix, data, 'post')
}

export const removeUserUnits = (uid, codes) => {
  const route = `/users/${uid}/elements`
  const data = { codes }
  const prefix = 'EDIT_USER_UNIT_'
  return callController(route, prefix, data, 'delete')
}

export const setFaculties = (uid, faculties) => {
  const route = `/users/${uid}/faculties`
  const data = { faculties }
  const prefix = 'SET_USER_FACULTIES_'
  return callController(route, prefix, data, 'post')
}

export const reducer = (state = { data: [], enabledOnly: true }, action) => {
  switch (action.type) {
    case 'GET_USERS_ATTEMPT':
      return {
        ...state,
        enabledOnly: false,
        pending: true,
      }
    case 'GET_USERS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
      }
    case 'GET_USERS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
      }
    case 'EDIT_USER_UNIT_ATTEMPT':
      return {
        ...state,
        userunitpending: true,
        useruniterror: false,
      }
    case 'EDIT_USER_UNIT_FAILURE':
      return {
        ...state,
        userunitpending: false,
        useruniterror: true,
      }
    case 'EDIT_USER_UNIT_SUCCESS':
      return {
        ...state,
        userunitpending: false,
        useruniterror: false,
        data: state.data.filter(user => user.id !== action.response.id).concat(action.response),
      }
    case 'MODIFY_ACCESSGROUPS_ATTEMPT':
      return {
        ...state,
        accessgroupPending: true,
        accessgroupError: false,
      }
    case 'MODIFY_ACCESSGROUPS_FAILURE':
      return {
        ...state,
        accessgroupPending: false,
        accessgroupError: true,
      }
    case 'MODIFY_ACCESSGROUPS_SUCCESS':
      return {
        ...state,
        accessgroupPending: false,
        accessgroupError: false,
        data: state.data.filter(user => user.id !== action.response.id).concat(action.response),
      }
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
