import { callController } from '../apiConnection'

export const getFaculties = () => {
  const route = '/faculties'
  const prefix = 'GET_FACULTIES_'
  return callController(route, prefix)
}

const reducer = (state = { data: [], pending: false, error: false }, action) => {
  switch (action.type) {
    case 'GET_FACULTIES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_FACULTIES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'GET_FACULTIES_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: true
      }
    default:
      return state
  }
}

export default reducer
