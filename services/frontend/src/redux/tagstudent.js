import { callController } from '../apiConnection'

export const getStudentTagsAction = () => {
  const route = '/studenttags'
  const prefix = 'GET_STUDENT_TAGS_'
  return callController(route, prefix)
}

export const createStudentTagAction = (tag, studytrack, combinedProgramme) => {
  const route = `/studenttags/${tag.studentnumber}`
  const prefix = 'CREATE_STUDENT_TAG_'
  const method = 'post'
  const data = { tag, studytrack, combinedProgramme }
  return callController(route, prefix, data, method)
}

export const createMultipleStudentTagAction = (tags, studytrack, combinedProgramme) => {
  const route = '/studenttags'
  const prefix = 'CREATE_MULTIPLE_TAGS_'
  const method = 'post'
  const data = { tags, studytrack, combinedProgramme }
  return callController(route, prefix, data, method)
}

export const deleteMultipleStudentTagAction = (tagId, studentnumbers, studytrack, combinedProgramme) => {
  const route = '/studenttags/delete_many'
  const prefix = 'DELETE_MULTIPLE_TAGS_'
  const method = 'delete'
  const data = { tagId, studentnumbers, studytrack, combinedProgramme }
  return callController(route, prefix, data, method)
}
// Combined programme is included to studytrack in form KHxx_xxx-MHxx_xxx
export const getStudentTagsByStudytrackAction = studytrack => {
  const route = `/studenttags/${studytrack}`
  const prefix = 'GET_STUDENT_TAGS_BY_ST_'
  const data = { studytrack }
  return callController(route, prefix, data)
}

export const getStudentTagsByStudentnumberAction = studentnumber => {
  const route = `/studenttags/${studentnumber}`
  const prefix = 'GET_STUDENT_TAG_BY_SN_'
  return callController(route, prefix)
}

export const deleteStudentTagAction = (tagId, studentnumber, studytrack, combinedProgramme) => {
  const route = '/studenttags/delete_one'
  const prefix = 'DELETE_STUDENT_TAG_'
  const method = 'delete'
  const data = { tag_id: tagId, studentnumber, studytrack, combinedProgramme }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [], success: false, created: false, pending: false, error: null }, action) => {
  switch (action.type) {
    case 'GET_STUDENT_TAGS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: null,
      }
    case 'GET_STUDENT_TAGS_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || {},
        error: null,
      }
    case 'GET_STUDENT_TAGS_FAILURE':
      return {
        ...state,
        pending: false,
        error: null,
      }
    case 'GET_STUDENT_TAGS_BY_ST_ATTEMPT':
      return {
        ...state,
        pending: true,
        success: false,
        error: null,
      }
    case 'GET_STUDENT_TAGS_BY_ST_FAILURE':
      return {
        ...state,
        pending: false,
        success: false,
        error: null,
      }
    case 'GET_STUDENT_TAGS_BY_ST_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || [],
        success: true,
        error: null,
      }
    case 'GET_STUDENT_TAG_BY_SN_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: null,
      }
    case 'GET_STUDENT_TAG_BY_SN_FAILURE':
      return {
        ...state,
        pending: false,
        error: null,
      }
    case 'GET_STUDENT_TAG_BY_SN_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || [],
        error: null,
      }
    case 'CREATE_STUDENT_TAG_ATTEMPT':
      return {
        ...state,
        pending: true,
        success: false,
        error: null,
      }
    case 'CREATE_STUDENT_TAG_FAILURE':
      return {
        ...state,
        pending: false,
        success: false,
        error: null,
      }
    case 'CREATE_STUDENT_TAG_SUCCESS':
      return {
        ...state,
        pending: false,
        success: true,
        data: action.response,
        error: null,
      }
    case 'DELETE_STUDENT_TAG_ATTEMPT':
      return {
        ...state,
        success: false,
        pending: true,
        error: null,
      }
    case 'DELETE_STUDENT_TAG_FAILURE':
      return {
        ...state,
        success: false,
        pending: false,
        error: null,
      }
    case 'DELETE_STUDENT_TAG_SUCCESS':
      return {
        ...state,
        pending: false,
        success: true,
        data: action.response,
        error: null,
      }
    case 'DELETE_MULTIPLE_TAGS_ATTEMPT':
      return {
        ...state,
        pending: true,
        success: false,
        error: null,
      }
    case 'DELETE_MULTIPLE_TAGS_FAILURE':
      return {
        ...state,
        pending: false,
        success: false,
        error: action.response.response.data.error,
      }
    case 'DELETE_MULTIPLE_TAGS_SUCCESS':
      return {
        ...state,
        pending: false,
        success: true,
        error: null,
        data: action.response,
      }
    case 'CREATE_MULTIPLE_TAGS_ATTEMPT':
      return {
        ...state,
        pending: true,
        success: false,
        error: null,
      }
    case 'CREATE_MULTIPLE_TAGS_FAILURE':
      return {
        ...state,
        pending: false,
        success: false,
        error: action.response.response.data.error,
      }
    case 'CREATE_MULTIPLE_TAGS_SUCCESS':
      return {
        ...state,
        pending: false,
        success: true,
        data: action.response,
        error: null,
      }
    default:
      return state
  }
}

export default reducer
