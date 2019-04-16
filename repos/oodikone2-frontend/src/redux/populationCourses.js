import { callController } from '../apiConnection'

export const getPopulationCourses = ({
  year, semesters, studentStatuses, studyRights, months, uuid
}) => {
  const route = '/v2/populationstatistics/courses'
  const prefix = 'GET_POPULATION_COURSES_'
  const query = {
    year, semesters, studentStatuses, studyRights, uuid
  }
  const params = {
    year,
    semesters,
    studentStatuses,
    months,
    studyRights
  }
  return callController(route, prefix, null, 'get', query, params)
}

export const clearPopulationCourses = () => ({
  type: 'CLEAR_POPULATIONS_COURSES'
})

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'GET_POPULATION_COURSES_ATTEMPT':
      return [...state, {
        pending: true,
        error: false,
        data: {},
        query: action.requestSettings.query
      }]
    case 'GET_POPULATION_COURSES_FAILURE':
      return [...state.filter(apiCall => !apiCall.pending), {
        pending: false,
        error: true,
        data: action.response,
        query: action.query
      }]
    case 'GET_POPULATION_COURSES_SUCCESS':
      return [...state.filter(apiCall => !apiCall.pending), {
        pending: false,
        error: false,
        data: action.response,
        query: action.query
      }]
    case 'REMOVE_POPULATION_COURSES':
      return [...state.filter(apiCall => apiCall.query.uuid !== action.uuid)]
    case 'CLEAR_POPULATIONS_COURSES':
      return []
    default:
      return state
  }
}

export default reducer
