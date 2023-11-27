import { callController } from '../apiConnection'

// Implemented also in './facultyStats'
// Use that for new stuff or switch while refactoring

export const getFaculties = () => {
  const route = '/faculties-only'
  const prefix = 'GET_FACULTIES_'
  return callController(route, prefix)
}

export const reducer = (
  state = {
    data: [],
    yearlyStats: [],
    facultyProgrammes: [],
    pending: false,
    error: false,
    userFacultiesPending: false,
    userFacultiesError: false,
  },
  action
) => {
  switch (action.type) {
    case 'GET_FACULTIES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
      }
    case 'GET_FACULTIES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
      }
    case 'GET_FACULTIES_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: true,
      }
    default:
      return state
  }
}
