import { callController } from '../apiConnection'

const initialState = {
  pending: false,
  error: false,
  data: {},
  query: undefined,
  updating: false,
  customPopulationFlag: false,
}

export const getPopulationStatistics = ({
  semesters,
  studentStatuses,
  studyRights,
  months,
  uuid,
  tag,
  year,
  years,
  onProgress,
}) => {
  const route = !tag ? '/v3/populationstatistics/' : '/v3/populationstatisticsbytag'
  const prefix = 'GET_POPULATION_STATISTICS_'
  const query = {
    semesters,
    studentStatuses,
    studyRights,
    uuid,
    months,
    tag,
    year,
    years,
  }
  const params = {
    semesters,
    studentStatuses,
    months,
    studyRights,
    tag,
    year,
    years,
  }
  return callController(route, prefix, null, 'get', query, params, onProgress)
}

export const getCoursePopulation = ({ coursecodes, from, to, onProgress, separate, unifyCourses }) => {
  const route = '/v3/populationstatisticsbycourse'
  const prefix = 'GET_STUDENTS_OF_COURSE_'
  const params = { coursecodes, from, to, separate, unifyCourses }
  const query = { coursecodes, from, to, studyRights: { programme: 'KH555' } } // why is programme defined to some garbo?

  return callController(route, prefix, null, 'get', query, params, onProgress)
}

export const getCustomPopulation = ({ studentnumberlist, onProgress, usingStudyGuidanceGroups }) => {
  const route = '/v3/populationstatisticsbystudentnumbers'
  const prefix = 'GET_CUSTOM_POP_'
  const tags = { studyProgramme: '', year: 1900 } // This nonsense is added here becaus of the studyguidance groups
  const params = { studentnumberlist, usingStudyGuidanceGroups }
  const query = { studentnumberlist, studyRights: { programme: 'KH555' } }
  const body = { studentnumberlist, usingStudyGuidanceGroups, tags }
  return callController(route, prefix, body, 'post', query, params, onProgress)
}

export const clearPopulations = () => ({
  type: 'CLEAR_POPULATIONS',
})

export const removePopulation = uuid => ({
  type: 'REMOVE_POPULATION',
  uuid,
})

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_STATISTICS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        data: {},
        query: action.requestSettings.query,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_POPULATION_STATISTICS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
        query: action.query,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_POPULATION_STATISTICS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
        query: action.query,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_STUDENTS_OF_COURSE_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: null,
        data: {},
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_STUDENTS_OF_COURSE_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_STUDENTS_OF_COURSE_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_CUSTOM_POP_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: null,
        data: {},
        updating: false,
        customPopulationFlag: true,
      }
    case 'GET_CUSTOM_POP_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
        updating: false,
        customPopulationFlag: true,
      }
    case 'GET_CUSTOM_POP_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
        updating: false,
        customPopulationFlag: true,
      }
    case 'UPDATE_POPULATION_STUDENTS_ATTEMPT':
      return {
        ...state,
        updating: true,
      }
    case 'UPDATE_POPULATION_STUDENTS_FAILURE':
      return {
        ...state,
        updating: false,
      }
    case 'UPDATE_POPULATION_STUDENTS_SUCCESS':
      return {
        ...state,
        updating: false,
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
