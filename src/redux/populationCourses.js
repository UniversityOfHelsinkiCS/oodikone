import { callController } from '../apiConnection'

const getArrayParams = (paramName, entries) => entries.map(entry => `&${paramName}=${entry}`).join('')

export const getPopulationCourses = ({
  year, semester, studyRights, months, uuid
}) => {
  const route = `/v2/populationstatistics/courses?year=${year}&semester=${semester}${getArrayParams('studyRights', studyRights)}&months=${months}`
  const prefix = 'GET_POPULATION_COURSES_'
  const query = {
    year, semester, studyRights, uuid
  }
  return callController(route, prefix, null, 'get', query)
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
        data: [],
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
