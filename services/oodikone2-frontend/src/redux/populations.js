import { callController } from '../apiConnection'

const initialState = {
  pending: false,
  error: false,
  data: {},
  query: undefined,
  updating: false
}

export const getPopulationStatistics = ({
  endYear,
  semesters,
  studentStatuses,
  studyRights,
  months,
  uuid,
  tag,
  startYear,
  onProgress
}) => {
  const route = !tag ? '/v3/populationstatistics/' : '/v3/populationstatisticsbytag'
  const prefix = 'GET_POPULATION_STATISTICS_'
  const query = {
    endYear,
    semesters,
    studentStatuses,
    studyRights,
    uuid,
    months,
    tag,
    startYear
  }
  const params = {
    endYear,
    semesters,
    studentStatuses,
    months,
    studyRights,
    tag,
    startYear
  }
  return callController(route, prefix, null, 'get', query, params, onProgress)
}

export const getCoursePopulation = ({ coursecodes, from, to, onProgress }) => {
  const route = '/v3/populationstatisticsbycourse'
  const prefix = 'GET_STUDENTS_OF_COURSE_'
  const params = { coursecodes, from, to }
  const query = { coursecodes, from, to, studyRights: { programme: 'KH555' } } // why is programme defined to some garbo?

  return callController(route, prefix, null, 'get', query, params, onProgress)
}

export const getCustomPopulation = ({ studentnumberlist, onProgress }) => {
  const route = '/v3/populationstatisticsbystudentnumbers'
  const prefix = 'GET_CUSTOM_POP_'
  const params = { studentnumberlist }
  const query = { studentnumberlist, studyRights: { programme: 'KH555' } }
  const body = { studentnumberlist }
  return callController(route, prefix, body, 'post', query, params, onProgress)
}

export const updatePopulationStudents = students => {
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
    case 'GET_STUDENTS_OF_COURSE_ATTEMPT':
      return {
        pending: true,
        error: false,
        data: {},
        updating: false
      }
    case 'GET_STUDENTS_OF_COURSE_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response,
        updating: false
      }
    case 'GET_STUDENTS_OF_COURSE_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
        updating: false
      }
    case 'GET_CUSTOM_POP_ATTEMPT':
      return {
        pending: true,
        error: false,
        data: {},
        updating: false
      }
    case 'GET_CUSTOM_POP_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response,
        updating: false
      }
    case 'GET_CUSTOM_POP_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
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
