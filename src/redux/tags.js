import { callController } from '../apiConnection'

export const findTags = (searchStr) => {
  const route = searchStr && searchStr.length > 0
    ? `/tags/?query=${searchStr}`
    : '/tags/'
  const prefix = 'FIND_TAGS_'
  return callController(route, prefix)
}

export const removeTagFromStudent = (studentNumber, tag) => {
  const route = `/students/${studentNumber}/tags`
  const prefix = 'REMOVE_TAG_'
  return callController(route, prefix, tag, 'delete')
}

export const addTagToStudent = (studentNumber, tag) => {
  const route = `/students/${studentNumber}/tags`
  const prefix = 'ADD_TAG_'
  return callController(route, prefix, tag, 'post')
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'FIND_TAGS_ATTEMPT':
      return {
        pending: true
      }
    case 'FIND_TAGS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'FIND_TAGS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response
      }
    case 'ADD_TAG_ATTEMPT':
    case 'ADD_TAG_FAILURE':
    case 'ADD_TAG_SUCCESS':
    case 'REMOVE_TAG_ATTEMPT':
    case 'REMOVE_TAG_FAILURE':
    case 'REMOVE_TAG_SUCCESS':
    default:
      return state
  }
}

export default reducer
