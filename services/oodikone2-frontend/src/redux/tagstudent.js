import { callController } from '../apiConnection'

export const getStudentTags = () => {
  const route = '/studenttags'
  const prefix = 'GET_STUDENT_TAGS_'
  return callController(route, prefix)
}

export const createStudentTag = (tag) => {
  const route = '/tags'
  const prefix = 'CREATE_STUDENT_TAG_'
  const method = 'post'
  const data = { tag }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [] }, action) => {
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
    default:
      return state
  }
}

export default reducer
