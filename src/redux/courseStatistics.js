import { callController } from '../apiConnection'

export const getCourseStatistics = ({ code, start, end, separate, language }) => {
  const route = `/courseyearlystats/?start=${start}&code=${code}&end=${end}&separate=${separate}&language=${language}`
  const prefix = 'FIND_COURSE_STATISTICS_'
  return callController(route, prefix)
}

export const getMultipleCourseStatistics = ({ codes, start, end, separate, language }) => {
  const route = `/v2/courseyearlystats/?start=${start}&codes=${JSON.stringify(codes)}&end=${end}&separate=${separate}&language=${language}` // eslint-disable-line
  const prefix = 'FIND_COURSE_STATISTICS_'
  return callController(route, prefix)
}

export const getCourseTypes = () => {
  const route = '/coursetypes'
  const prefix = 'FIND_COURSE_TYPES_'
  return callController(route, prefix)
}

export const getCourseDisciplines = () => {
  const route = '/courseDisciplines'
  const prefix = 'FIND_COURSE_DISCIPLINES_'
  return callController(route, prefix)
}

export const clearCouresStatistics = () => ({
  type: 'CLEAR_COURSE_STATISTICS'
})

export const removeCourseStatistics = ({ end, start, separate, code }) => ({
  type: 'REMOVE_COURSE_STATISTICS',
  end,
  start,
  separate,
  code
})

const reducer = (state = { data: [], selected: [] }, action) => {
  switch (action.type) {
    case 'FIND_COURSE_STATISTICS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'FIND_COURSE_STATISTICS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'FIND_COURSE_STATISTICS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        selected: [...state.selected, ...action.response.map(res => ({
          code: res.code,
          start: res.start,
          end: res.end,
          separate: res.separate,
          name: res.name
        }))],
        data: [...action.response, ...state.data]
      }
    case 'REMOVE_COURSE_STATISTICS':
      return {
        ...state,
        pending: false,
        error: false,
        selected: [...state.selected.filter(query => query.code !== action.code ||
          query.start !== action.start ||
          query.end !== action.end ||
          query.separate !== action.separate)],
        data: [...state.data.filter(query => query.code !== action.code ||
          query.start !== action.start ||
          query.end !== action.end ||
          query.separate !== action.separate)]
      }
    case 'FIND_COURSE_TYPES_ATTEMPT':
      return {
        ...state,
        types_pending: true
      }
    case 'FIND_COURSE_TYPES_FAILURE':
      return {
        ...state,
        types_pending: false,
        error: true
      }
    case 'FIND_COURSE_TYPES_SUCCESS':
      return {
        ...state,
        types_pending: false,
        error: false,
        courseTypes: action.response
      }
    case 'FIND_COURSE_DISCIPLINES_ATTEMPT':
      return {
        ...state,
        disciplines_pending: true
      }
    case 'FIND_COURSE_DISCIPLINES_FAILURE':
      return {
        ...state,
        disciplines_pending: false,
        error: true
      }
    case 'FIND_COURSE_DISCIPLINES_SUCCESS':
      return {
        ...state,
        disciplines_pending: false,
        error: false,
        courseDisciplines: action.response
      }
    case 'CLEAR_COURSE_STATISTICS':
      return { ...state, data: [], selected: [] }
    default:
      return state
  }
}

export default reducer
