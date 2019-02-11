import { callController } from '../apiConnection'

export const getUsers = () => {
  const route = '/users'
  const prefix = 'GET_USERS_'
  return callController(route, prefix)
}

export const getAccessGroups = () => {
  const route = '/users/access_groups'
  const prefix = 'GET_ACCESSGROUPS_'
  return callController(route, prefix)
}
export const modifyAccessGroups = (uid, accessgroups) => {
  const route = '/users/modifyaccess'
  const prefix = 'MODIFY_ACCESSGROUPS_'
  const method = 'post'
  const data = { uid, accessgroups }
  return callController(route, prefix, data, method)
}

export const enableUser = (id) => {
  const route = `/users/${id}/enable`
  const prefix = 'ENABLE_USER_'
  const method = 'put'
  return callController(route, prefix, null, method)
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

export const sendEmail = (email) => {
  const route = '/users/email'
  const prefix = 'SEND_EMAIL_'
  const data = { email }
  const method = 'post'
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_USERS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'GET_USERS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response
      }
    case 'GET_USERS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response
      }
    case 'GET_ACCESSGROUPS_ATTEMPT':
      return {
        ...state,
        accessgroupPending: true,
        error: state.error
      }
    case 'GET_ACCESSGROUPS_FAILURE':
      return {
        ...state,
        accessgroupPending: false,
        error: true,
        accessGroupsData: action.response
      }
    case 'GET_ACCESSGROUPS_SUCCESS':
      return {
        ...state,
        accessgroupPending: false,
        error: false,
        accessGroupsData: action.response
      }
    case 'ENABLE_USER_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'ENABLE_USER_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response
      }
    case 'ENABLE_USER_SUCCESS':
      return {
        ...state,
        pending: false,
        data: state.data.filter(user => user.id !== action.response.id)
          .concat(action.response)
      }
    case 'EDIT_USER_UNIT_SUCCESS':
      return {
        ...state,
        data: state.data.filter(user => user.id !== action.response.id)
          .concat(action.response)
      }
    case 'MODIFY_ACCESSGROUPS_SUCCESS':
      return {
        ...state,
        data: state.data.filter(user => user.id !== action.response.id)
          .concat(action.response)
      }
    case 'SEND_EMAIL_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'SEND_EMAIL_SUCCESS':
      return {
        ...state,
        pending: false
      }
    case 'SEND_EMAIL_FAILURE':
      return {
        ...state,
        pending: false
      }
    default:
      return state
  }
}

export default reducer
