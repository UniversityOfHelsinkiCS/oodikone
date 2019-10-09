import { actions } from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_COURSE_SEARCH_RESULT_'

const storeActions = actions(prefix)

export const clearCourses = storeActions.clear

export const findCourses = ({ name, type, discipline }, language = 'fi') => {
  const route = '/coursesmulti'
  const params = { name, type, discipline, language }
  return callController(route, prefix, [], 'get', params, params)
}

export const findCoursesV2 = ({ name, code }) => {
  const route = '/v2/coursesmulti'
  const params = { name, code }
  return callController(route, prefix, [], 'get', params, params)
}

export const toggleUnifyOpenUniCourses = () => ({
  type: 'TOGGLE_UNIFY_OPEN_UNI_COURSES'
})

const reducer = (state = { data: {}, pending: false, unifyOpenUniCourses: false }, action) => {
  switch (action.type) {
    case 'GET_COURSE_SEARCH_RESULT_ATTEMPT':
      return {
        ...state,
        pending: true,
        lastSearch: action.requestSettings.query
      }
    case 'GET_COURSE_SEARCH_RESULT_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'GET_COURSE_SEARCH_RESULT_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data:
          action.query.code === state.lastSearch.code && action.query.name === state.lastSearch.name
            ? action.response
            : state.data
      }
    case 'TOGGLE_UNIFY_OPEN_UNI_COURSES':
      return {
        ...state,
        unifyOpenUniCourses: !state.unifyOpenUniCourses
      }
    default:
      return state
  }
}

export default reducer
