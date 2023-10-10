import { callController } from '../apiConnection/index'

export const setCourseExclusion = (programmecode, excludeFromProgramme, coursecodes, curriculum) => {
  const prefix = 'SET_COURSE_EXCLUSION_'
  const route = `/v3/programme_modules/${programmecode}`
  const method = 'post'
  const data = { programmecode, excludeFromProgramme, coursecodes, curriculum }
  return callController(route, prefix, data, method)
}

export const removeCourseExclusion = ({ programmeCode, curriculumVersion, courseCodes }) => {
  const prefix = 'REMOVE_COURSE_EXCLUSION_'
  const route = `/v3/programme_modules/`
  const method = 'delete'
  const data = { programmeCode, curriculumVersion, courseCodes }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: {} }, action) => {
  switch (action.type) {
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
    default:
      return state
  }
}

export default reducer
