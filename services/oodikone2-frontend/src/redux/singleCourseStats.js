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

const reducer = (state = { stats: {}, pending: false, error: false }, action) => {
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
    default:
      return state
  }
}

export default reducer
