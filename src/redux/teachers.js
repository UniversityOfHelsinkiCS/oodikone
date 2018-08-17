import { callController } from '../apiConnection'

const prefix = {
  find: 'FIND_TEACHERS_'
}

const types = {
  find: {
    attempt: `${prefix.find}ATTEMPT`,
    failure: `${prefix.find}FAILURE`,
    success: `${prefix.find}SUCCESS`
  }
}

export const findTeachers = (searchString) => {
  const route = `/teachers/?searchTerm=${searchString}`
  return callController(route, prefix.find)
}

const initial = {
  pending: false,
  error: false,
  data: []
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
        data: action.response
      }
    case types.find.failure:
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response
      }
    default:
      return state
  }
}

export default reducer
