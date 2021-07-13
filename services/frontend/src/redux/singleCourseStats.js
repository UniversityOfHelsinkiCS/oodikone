import { callController } from '../apiConnection/index'

export const getSingleCourseStats = ({ fromYear, toYear, courseCodes, separate, unifyOpenUniCourses }) => {
  const route = '/v3/courseyearlystats'
  const params = {
    codes: courseCodes,
    startyearcode: fromYear,
    endyearcode: toYear,
    separate,
    unifyOpenUniCourses,
  }
  return callController(route, 'GET_SINGLE_COURSE_STATS_', [], 'get', params, params)
}

export const setSelectedCourse = code => ({
  type: 'SET_SELECTED_COURSE',
  selectedCourse: code,
})

export const clearSelectedCourse = () => ({
  type: 'CLEAR_SELECTED_COURSE',
})

export const getMaxYearsToCreatePopulationFrom = ({ courseCodes }) => {
  const route = '/v3/populationstatistics/maxYearsToCreatePopulationFrom'
  const params = {
    courseCodes,
  }

  return callController(route, 'GET_MAX_YEARS_TO_CREATE_POPULATION_FROM_', null, 'get', null, params)
}

const reducer = (
  state = { stats: {}, pending: false, error: false, selectedCourse: null, maxYearsToCreatePopulationFrom: -1 },
  action
) => {
  switch (action.type) {
    case 'GET_SINGLE_COURSE_STATS_ATTEMPT':
      return {
        ...state,
        stats: {},
        pending: true,
        error: false,
      }
    case 'GET_SINGLE_COURSE_STATS_SUCCESS':
      return {
        ...state,
        stats: action.response[0],
        pending: false,
        error: false,
      }
    case 'GET_SINGLE_COURSE_STATS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
      }
    case 'SET_SELECTED_COURSE':
      return {
        ...state,
        selectedCourse: action.selectedCourse,
      }
    case 'CLEAR_SELECTED_COURSE':
      return {
        ...state,
        selectedCourse: null,
      }
    case 'GET_MAX_YEARS_TO_CREATE_POPULATION_FROM_SUCCESS':
      return {
        ...state,
        maxYearsToCreatePopulationFrom: action.response,
      }
    default:
      return state
  }
}

export default reducer
