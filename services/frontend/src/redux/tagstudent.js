import { callController } from '@/apiConnection'

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

export const deleteStudentTagAction = (tagId, studentnumber, studytrack, combinedProgramme) => {
  const route = '/studenttags/delete_one'
  const prefix = 'DELETE_STUDENT_TAG_'
  const method = 'delete'
  const data = { tag_id: tagId, studentnumber, studytrack, combinedProgramme }
  return callController(route, prefix, data, method)
}

export const reducer = (state = { data: [], success: false, created: false, pending: false, error: null }, action) => {
  switch (action.type) {
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
