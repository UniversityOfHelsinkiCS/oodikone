import { callController } from '../apiConnection'

export const getFaculties = () => {
  const route = '/faculties'
  const prefix = 'GET_FACULTIES_'
  return callController(route, prefix)
}

export const getUserFaculties = () => {
  const route = '/facultystats/faculties'
  const prefix = 'GET_USER_FACULTIES_'
  return callController(route, prefix)
}

export const getFacultiesYearlyStats = () => {
  const route = '/facultystats/yearlystats'
  const prefix = 'GET_FACULTIES_YEARLY_STATS_'
  return callController(route, prefix)
}

export const getFacultyProgrammes = () => {
  const route = '/facultystats/programmes'
  const prefix = 'GET_FACULTY_PROGRAMMES_'
  return callController(route, prefix)
}

const reducer = (
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
    case 'GET_USER_FACULTIES_ATTEMPT':
      return {
        ...state,
        userFacultiesPending: true,
        userFacultiesError: false,
      }
    case 'GET_USER_FACULTIES_FAILURE':
      return {
        ...state,
        userFacultiesPending: false,
        userFacultiesError: true,
      }
    case 'GET_USER_FACULTIES_SUCCESS':
      return {
        ...state,
        data: action.response,
        userFacultiesPending: false,
        userFacultiesError: false,
      }
    case 'GET_FACULTIES_YEARLY_STATS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
      }
    case 'GET_FACULTIES_YEARLY_STATS_SUCCESS':
      return {
        ...state,
        yearlyStats: action.response,
        pending: false,
        error: true,
      }
    case 'GET_FACULTY_PROGRAMMES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
      }
    case 'GET_FACULTY_PROGRAMMES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
      }
    case 'GET_FACULTY_PROGRAMMES_SUCCESS':
      return {
        ...state,
        facultyProgrammes: action.response,
        pending: false,
        error: false,
      }
    default:
      return state
  }
}

export default reducer
