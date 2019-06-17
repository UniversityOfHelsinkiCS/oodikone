import { callController } from '../apiConnection'

export const getStudentTagsAction = () => {
  const route = '/studenttags'
  const prefix = 'GET_STUDENT_TAGS_'
  return callController(route, prefix)
}

export const createStudentTagAction = (tag) => {
  const route = '/studenttags'
  const prefix = 'CREATE_STUDENT_TAG_'
  const method = 'post'
  const data = { tag }
  return callController(route, prefix, data, method)
}

export const getStudentTagsByStudytrackAction = (studytrack) => {
  const route = `/studenttags/${studytrack}`
  const prefix = 'GET_STUDENT_TAGS_BY_ST_'
  const data = { studytrack }
  return callController(route, prefix, data)
}

export const getStudentTagsByStudentnumberAction = (studentnumber) => {
  const route = `/studenttags/${studentnumber}`
  const prefix = 'GET_STUDENT_TAG_BY_SN_'
  return callController(route, prefix)
}

export const deleteStudentTagAction = (tag) => {
  const route = '/studenttags'
  const prefix = 'DELETE_STUDENT_TAG_'
  const method = 'delete'
  const data = { tag }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [], success: false }, action) => {
  switch (action.type) {
    case 'GET_STUDENT_TAGS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'GET_STUDENT_TAGS_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || {}
      }
    case 'GET_STUDENT_TAGS_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'GET_STUDENT_TAGS_BY_ST_ATTEMPT':
      return {
        ...state,
        pending: true,
        success: false
      }
    case 'GET_STUDENT_TAGS_BY_ST_FAILURE':
      return {
        ...state,
        pending: false,
        success: false
      }
    case 'GET_STUDENT_TAGS_BY_ST_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || [],
        success: true
      }
    case 'GET_STUDENT_TAG_BY_SN_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'GET_STUDENT_TAG_BY_SN_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'GET_STUDENT_TAG_BY_SN_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || []
      }
    case 'CREATE_STUDENT_TAG_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'CREATE_STUDENT_TAG_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'CREATE_STUDENT_TAG_SUCCESS':
      return {
        ...state,
        pending: false
      }
    case 'DELETE_STUDENT_TAG_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'DELETE_STUDENT_TAG_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'DELETE_STUDENT_TAG_SUCCESS':
      return {
        ...state,
        pending: false
      }
    default:
      return state
  }
}

export default reducer
