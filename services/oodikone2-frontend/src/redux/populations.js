import { callController } from '../apiConnection'

const initialState = {
  pending: false,
  error: false,
  data: {},
  query: undefined,
  updating: false
}

export const getPopulationStatistics = ({
  year, semesters, studentStatuses, studyRights, months, uuid, tag, tagYear
}) => {
  const route = '/v3/populationstatistics/'
  const prefix = 'GET_POPULATION_STATISTICS_'
  const query = {
    year, semesters, studentStatuses, studyRights, uuid, months, tag, tagYear
  }
  const params = {
    year,
    semesters,
    studentStatuses,
    months,
    studyRights,
    tag,
    tagYear
  }
  return callController(route, prefix, null, 'get', query, params)
}
export const updatePopulationStudents = (students) => {
  const route = '/updatedatabase'
  const prefix = 'UPDATE_POPULATION_STUDENTS_'

  return callController(route, prefix, students, 'post')
}
export const clearPopulations = () => ({
  type: 'CLEAR_POPULATIONS'
})

export const removePopulation = uuid => ({
  type: 'REMOVE_POPULATION',
  uuid
})

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_STATISTICS_ATTEMPT':
      return {
        pending: true,
        error: false,
        data: {},
        query: action.requestSettings.query,
        updating: false
      }
    case 'GET_POPULATION_STATISTICS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response,
        query: action.query,
        updating: false
      }
    case 'GET_POPULATION_STATISTICS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
        query: action.query,
        updating: false
      }
    case 'UPDATE_POPULATION_STUDENTS_ATTEMPT':
      return {
        ...state,
        updating: true
      }
    case 'UPDATE_POPULATION_STUDENTS_FAILURE':
      return {
        ...state,
        updating: false
      }
    case 'UPDATE_POPULATION_STUDENTS_SUCCESS':
      return {
        ...state,
        updating: false
      }
    case 'REMOVE_POPULATION':
      return initialState
    case 'CLEAR_POPULATIONS':
      return initialState
    default:
      return state
  }
}

export default reducer
