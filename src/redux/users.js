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

export const addUserUnit = (uid, unit) => {
  const route = `/users/${uid}/units/${unit}`
  const prefix = 'EDIT_USER_UNIT_'
  const data = { uid, unit }
  const method = 'post'
  return callController(route, prefix, data, method)
}

export const addUserUnits = (uid, codes) => {
  const route = `/users/${uid}/elements`
  const data = { codes }
  const prefix = 'EDIT_USER_UNIT_'
  return callController(route, prefix, data, 'post')
}

export const removeUserUnit = (uid, unit) => {
  const route = `/users/${uid}/units/${unit}`
  const prefix = 'EDIT_USER_UNIT_'
  const data = {}
  const method = 'delete'
  return callController(route, prefix, data, method)
}

export const toggleCzar = (id) => {
  const route = `/users/${id}/toggleczar`
  const prefix = 'TOGGLE_USER_CZAR_'
  const method = 'put'
  return callController(route, prefix, null, method)
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
        pending: true,
        error: state.error,
        data: state.data,
        ...state
      }
    case 'GET_USERS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response,
        ...state
      }
    case 'GET_USERS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response
      }
    case 'GET_ACCESSGROUPS_ATTEMPT':
      return {
        accessgroupPending: true,
        error: state.error,
        ...state
      }
    case 'GET_ACCESSGROUPS_FAILURE':
      return {
        accessgroupPending: false,
        error: true,
        accessGroupsData: action.response,
        ...state
      }
    case 'GET_ACCESSGROUPS_SUCCESS':
      return {
        accessgroupPending: false,
        error: false,
        accessGroupsData: action.response,
        ...state
      }
    case 'ENABLE_USER_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data,
        ...state
      }
    case 'ENABLE_USER_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response,
        ...state
      }
    case 'ENABLE_USER_SUCCESS':
      return {
        ...state,
        pending: false,
        data: state.data.filter(user => user.id !== action.response.id)
          .concat(action.response)
      }
    case 'TOGGLE_USER_CZAR_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data,
        ...state
      }
    case 'TOGGLE_USER_CZAR_SUCCESS':
      return {
        pending: false,
        error: state.error,
        data: state.data.filter(a => a.id !== action.response.id)
          .concat(action.response),
        ...state
      }
    case 'TOGGLE_USER_CZAR_FAILURE':
      return {
        pending: false,
        error: state.error,
        data: state.data,
        ...state
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
        pending: true,
        error: state.error,
        data: state.data,
        ...state
      }
    case 'SEND_EMAIL_SUCCESS':
      return {
        pending: false,
        error: state.error,
        data: state.data,
        ...state
      }
    case 'SEND_EMAIL_FAILURE':
      return {
        pending: false,
        error: state.error,
        data: state.data,
        ...state
      }
    default:
      return state
  }
}

export default reducer
