import { callController } from '../apiConnection/index'

export const getMandatoryCourses = (id) => {
  const prefix = 'GET_MANDATORY_COURSES_'
  const route = `/v2/studyprogrammes/${id}/mandatory_courses`
  return callController(route, prefix)
}

export const addMandatoryCourse = (id, course) => {
  const prefix = 'ADD_MANDATORY_COURSE_'
  const route = `/mandatory_courses/${id}`
  const method = 'post'
  const data = { course }
  return callController(route, prefix, data, method)
}

export const setMandatoryCourseLabel = (id, course, label) => {
  const prefix = 'SET_MANDATORY_COURSE_LABEL_'
  const route = `/mandatory_courses/${id}/label/${course}`
  const method = 'post'
  const data = { label }
  return callController(route, prefix, data, method)
}

export const deleteMandatoryCourse = (id, course) => {
  const prefix = 'DELETE_MANDATORY_COURSE_'
  const route = `/mandatory_courses/${id}`
  const method = 'delete'
  const data = { course }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_MANDATORY_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'GET_MANDATORY_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response
      }
    case 'GET_MANDATORY_COURSES_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response
      }
    case 'ADD_MANDATORY_COURSE_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'ADD_MANDATORY_COURSE_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'ADD_MANDATORY_COURSE_SUCCESS':
      return {
        pending: false,
        error: false,
        data: [...state.data, action.response]
      }
    case 'SET_MANDATORY_COURSE_LABEL_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'SET_MANDATORY_COURSE_LABEL_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'SET_MANDATORY_COURSE_LABEL_SUCCESS':
      return {
        pending: false,
        error: false,
        data: state.data.map(e => (e.code === action.response.code ? action.response : e))
      }
    case 'DELETE_MANDATORY_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'DELETE_MANDATORY_COURSE_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response
      }
    case 'DELETE_MANDATORY_COURSE_SUCCESS':
      return {
        pending: false,
        error: false,
        data: state.data.filter(course => course.code !== action.response)
      }
    default:
      return state
  }
}

export default reducer
