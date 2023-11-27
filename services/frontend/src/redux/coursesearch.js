import { callController } from '../apiConnection/index'

const prefix = 'GET_COURSE_SEARCH_RESULT_'

export const clearCourses = () => ({ type: 'CLEAR_SEARCH_RESULTS' })

export const findCoursesV2 = ({ name, code, combineSubstitutions }) => {
  const route = '/v2/coursesmulti'
  const params = { name, code, combineSubstitutions }
  return callController(route, prefix, [], 'get', params, params)
}

export const toggleOpenAndReqularCourses = showType => {
  return {
    type: 'TOGGLE_OPEN_AND_REQULAR_COURSES',
    showType,
  }
}

export const reducer = (state = { data: {}, pending: false, openOrReqular: 'unifyStats' }, action) => {
  switch (action.type) {
    case 'GET_COURSE_SEARCH_RESULT_ATTEMPT':
      return {
        ...state,
        pending: true,
        lastSearch: action.requestSettings.query,
      }
    case 'GET_COURSE_SEARCH_RESULT_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
      }
    case 'GET_COURSE_SEARCH_RESULT_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data:
          action.query.code === state.lastSearch.code && action.query.name === state.lastSearch.name
            ? action.response
            : state.data,
      }

    case 'TOGGLE_OPEN_AND_REQULAR_COURSES':
      return {
        ...state,
        openOrReqular: action.showType,
      }

    case 'CLEAR_SEARCH_RESULTS':
      return {
        ...state,
        data: {},
      }

    default:
      return state
  }
}
