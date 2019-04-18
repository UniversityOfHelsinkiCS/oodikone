import { callController } from '../apiConnection'

export const getUnits = () => {
  const route = '/studyprogrammes'
  const prefix = 'GET_UNITS_'
  return callController(route, prefix)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_UNITS_ATTEMPT':
      return {
        pending: true,
        data: state.data
      }
    case 'GET_UNITS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'GET_UNITS_SUCCESS':
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
