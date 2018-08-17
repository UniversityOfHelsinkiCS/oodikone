import { callController } from '../apiConnection'

export const findCourses = (searchStr, language) => {
  const route = `/courses/?name=${searchStr}&language=${language}`
  const prefix = 'FIND_COURSES_'
  return callController(route, prefix)
}

export const findMultipleCourses = ({ searchStr, type, discipline }, language) => {
  const route = `/coursesmulti/?${searchStr ? `name=${searchStr}` : ''}${type ? `&type=${type}` : ''}${discipline ? `&discipline=${discipline}` : ''}&language=${language}`
  const prefix = 'FIND_COURSES_MULTI_'
  return callController(route, prefix)
}

export const emptyCourseSearch = () => ({
  type: 'CLEAR_COURSE_SEARCH'
})

const reducer = (state = { data: {} }, action) => {
  switch (action.type) {
    case 'FIND_COURSES_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSES_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSES_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.code,
        data: action.response
      }
    case 'FIND_COURSES_MULTI_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSES_MULTI_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSES_MULTI_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.code,
        data: action.response
      }
    case 'CLEAR_COURSE_SEARCH':
      return {
        pending: false,
        selected: null,
        data: {}
      }
    default:
      return state
  }
}

export default reducer
