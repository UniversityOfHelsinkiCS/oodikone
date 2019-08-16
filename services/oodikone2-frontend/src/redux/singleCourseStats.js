import { callController } from '../apiConnection/index'

export const getSingleCourseStats = ({ fromYear, toYear, courseCodes, separate }) => {
  const route = '/v3/courseyearlystats'
  const params = {
    codes: courseCodes,
    startyearcode: fromYear,
    endyearcode: toYear,
    separate
  }
  return callController(route, 'GET_SINGLE_COURSE_STATS_', [], 'get', params, params)
}

export const setSelectedCourse = code => ({
  type: 'SET_SELECTED_COURSE',
  selectedCourse: code
})

export const clearSelectedCourse = () => ({
  type: 'CLEAR_SELECTED_COURSE'
})

export const setFromYear = fromYear => ({
  type: 'SET_SINGLE_COURSE_FROM_YEAR',
  fromYear
})

export const setToYear = toYear => ({
  type: 'SET_SINGLE_COURSE_TO_YEAR',
  toYear
})

const reducer = (state = { stats: {}, pending: false, error: false, fromYear: null, toYear: null, selectedCourse: null }, action) => {
  switch (action.type) {
    case 'GET_SINGLE_COURSE_STATS_ATTEMPT':
      return {
        ...state,
        stats: {},
        pending: true,
        error: false
      }
    case 'GET_SINGLE_COURSE_STATS_SUCCESS':
      return {
        ...state,
        stats: action.response[0],
        pending: false,
        error: false
      }
    case 'GET_SINGLE_COURSE_STATS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'SET_SINGLE_COURSE_FROM_YEAR':
      return {
        ...state,
        fromYear: action.fromYear
      }
    case 'SET_SINGLE_COURSE_TO_YEAR':
      return {
        ...state,
        toYear: action.toYear
      }
    case 'SET_SELECTED_COURSE':
      return {
        ...state,
        selectedCourse: action.selectedCourse
      }
    case 'CLEAR_SELECTED_COURSE':
      return {
        ...state,
        selectedCourse: null
      }
    default:
      return state
  }
}

export default reducer
