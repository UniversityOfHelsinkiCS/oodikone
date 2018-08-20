import { callController } from '../apiConnection'

const prefix = {
  find: 'FIND_TEACHERS_',
  get: 'GET_TEACHER_'
}

const types = {
  find: {
    attempt: `${prefix.find}ATTEMPT`,
    failure: `${prefix.find}FAILURE`,
    success: `${prefix.find}SUCCESS`
  },
  get: {
    attempt: `${prefix.get}ATTEMPT`,
    failure: `${prefix.get}FAILURE`,
    success: `${prefix.get}SUCCESS`
  }
}

export const findTeachers = (searchString) => {
  const route = `/teachers/?searchTerm=${searchString}`
  return callController(route, prefix.find)
}

export const getTeacher = (teacherid) => {
  const route = `/teachers/${teacherid}`
  return callController(route, prefix.get)
}

const initial = {
  pending: false,
  error: false,
  list: [],
  items: {}
}

const reducer = (state = initial, action) => {
  switch (action.type) {
    case types.find.attempt:
      return {
        ...state,
        pending: true
      }
    case types.find.success:
      return {
        ...state,
        pending: false,
        list: action.response
      }
    case types.find.failure:
      return {
        ...state,
        pending: false,
        error: true
      }
    case types.get.attempt:
      return {
        ...state,
        pending: true,
        error: false
      }
    case types.get.success:
      return {
        ...state,
        pending: false,
        error: false,
        items: { ...state.items, [action.response.id]: action.response }
      }
    case types.get.error:
      return {
        ...state,
        error: true
      }
    default:
      return state
  }
}

export default reducer
