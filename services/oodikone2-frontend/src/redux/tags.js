import { callController } from '../apiConnection'

export const getTags = () => {
  const route = '/tags'
  const prefix = 'GET_TAGS_'
  return callController(route, prefix)
}

export const createTag = (tag) => {
  const route = '/tags'
  const prefix = 'CREATE_TAG_'
  const method = 'post'
  const data = { tag }
  return callController(route, prefix, data, method)
}

export const deleteTag = (tag) => {
  const route = '/tags'
  const prefix = 'DELETE_TAG_'
  const method = 'delete'
  const data = { tag }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_TAGS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'GET_TAGS_SUCCESS':
      return {
        ...state,
        pending: false,
        data: action.response || {}
      }
    case 'GET_TAGS_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'CREATE_TAG_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'CREATE_TAG_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'CREATE_TAG_SUCCESS':
      return {
        ...state,
        pending: false
      }
    case 'DELETE_TAG_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'DELETE_TAG_FAILURE':
      return {
        ...state,
        pending: false
      }
    case 'DELETE_TAG_SUCCESS':
      return {
        ...state,
        pending: false
      }
    default:
      return state
  }
}

export default reducer
