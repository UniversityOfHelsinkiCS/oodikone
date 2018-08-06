import { callController } from '../apiConnection'

export const getUsers = () => {
  const route = '/users'
  const prefix = 'GET_USERS_'
  return callController(route, prefix)
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

export const removeUserUnit = (uid, unit) => {
  const route = `/users/${uid}/units/${unit}`
  const prefix = 'EDIT_USER_UNIT_'
  const data = {}
  const method = 'delete'
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_USERS_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data
      }
    case 'GET_USERS_FAILURE':
      return {
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
    case 'ENABLE_USER_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data
      }
    case 'ENABLE_USER_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'ENABLE_USER_SUCCESS':
      return {
        ...state,
        pending: false,
        data: state.data.filter(a => a.id !== action.response.id)
          .concat(action.response)
      }
    case 'EDIT_USER_UNIT_SUCCESS':
      return {
        ...state,
        data: state.data.filter(user => user.id !== action.response.id)
          .concat(action.response)
      }
    default:
      return state
  }
}

export default reducer
