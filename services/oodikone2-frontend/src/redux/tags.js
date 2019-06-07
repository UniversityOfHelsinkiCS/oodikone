import { callController } from '../apiConnection'

export const getTags = () => {
  console.log('redux')
  const route = '/tags'
  const prefix = 'GET_TAGS_'
  return callController(route, prefix)
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
    default:
      return state
  }
}

export default reducer
