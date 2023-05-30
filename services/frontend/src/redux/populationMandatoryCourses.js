import { callController } from '../apiConnection/index'

export const getMandatoryCourses = id => {
  const prefix = 'GET_MANDATORY_COURSES_'
  const route = `/v3/programme_modules/${id}`
  return callController(route, prefix)
}

export const getMandatoryCourseModules = id => {
  const prefix = 'GET_MANDATORY_MODULES_'
  const route = `/v3/programme_modules/${id}/modules`
  return callController(route, prefix)
}

export const setCourseExclusion = (programmecode, excludeFromProgramme, coursecodes) => {
  const prefix = 'SET_COURSE_EXCLUSION_'
  const route = `/v3/programme_modules/${programmecode}`
  const method = 'post'
  const data = { programmecode, excludeFromProgramme, coursecodes }
  return callController(route, prefix, data, method)
}

export const removeCourseExclusion = (programmecode, ids) => {
  const prefix = 'REMOVE_COURSE_EXCLUSION_'
  const route = `/v3/programme_modules/`
  const method = 'delete'
  const data = { programmecode, ids }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: {} }, action) => {
  switch (action.type) {
    case 'GET_MANDATORY_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
      }
    case 'GET_MANDATORY_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
      }
    case 'GET_MANDATORY_COURSES_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
      }
    case 'SET_COURSE_EXCLUSION_ATTEMPT':
      return {
        ...state,
        pending: true,
      }
    case 'SET_COURSE_EXCLUSION_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
      }
    case 'SET_COURSE_EXCLUSION_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
      }
    case 'REMOVE_COURSE_EXCLUSION_ATTEMPT':
      return {
        ...state,
        pending: true,
      }
    case 'REMOVE_COURSE_EXCLUSION_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
      }
    case 'REMOVE_COURSE_EXCLUSION_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
      }
    case 'GET_MANDATORY_MODULES_ATTEMPT':
      return {
        ...state,
        pending: true,
      }
    case 'GET_MANDATORY_MODULES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
      }
    case 'GET_MANDATORY_MODULES_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
      }
    default:
      return state
  }
}

export default reducer
