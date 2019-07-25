import { callController } from '../apiConnection'

export const findCourses = (searchStr, language) => {
  const route = `/courses/?name=${searchStr}&language=${language}`
  const prefix = 'FIND_COURSES_'
  return callController(route, prefix)
}

export const findMultipleCourses = ({ searchStr, type, discipline }, language = 'fi') => {
  const route = `/coursesmulti/?${searchStr ? `name=${searchStr}` : ''}
    ${type ? `&type=${type}` : ''}${discipline ? `&discipline=${discipline}` : ''}&language=${language}`
  const prefix = 'FIND_COURSES_MULTI_'
  return callController(route, prefix)
}

export const emptyCourseSearch = () => ({
  type: 'CLEAR_COURSE_SEARCH'
})

export const toggleCourseSelect = code => ({
  type: 'TOGGLE_COURSE_SELECT',
  code
})

const reducer = (state = { data: [], selected: [] }, action) => {
  switch (action.type) {
    case 'FIND_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'FIND_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'FIND_COURSES_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response
      }
    case 'FIND_COURSES_MULTI_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'FIND_COURSES_MULTI_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'FIND_COURSES_MULTI_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response
      }
    case 'CLEAR_COURSE_SEARCH':
      return {
        pending: false,
        data: [],
        selected: []
      }
    case 'TOGGLE_COURSE_SELECT':
      return {
        ...state,
        selected: state.selected.find(course => course.code === action.code) ?
          state.selected.filter(cr => cr.code !== action.code) :
          [...state.selected, state.data.find(course => course.code === action.code)]
      }
    default:
      return state
  }
}

export default reducer
