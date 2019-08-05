import { callController } from '../apiConnection'

export const getElementDetails = () => {
  const route = '/elementdetails/all'
  const prefix = 'GET_ELEMENTDETAILS_'
  return callController(route, prefix)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_ELEMENTDETAILS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ELEMENTDETAILS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'GET_ELEMENTDETAILS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response
      }
    default:
      return state
  }
}

export default reducer
