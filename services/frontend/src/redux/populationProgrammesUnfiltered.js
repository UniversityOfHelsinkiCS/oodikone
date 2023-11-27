import { callController } from '../apiConnection'

const prefix = 'GET_POPULATIONS_PROGRAMMES_UNFILTERED'

const types = {
  attempt: `${prefix}ATTEMPT`,
  failure: `${prefix}FAILURE`,
  success: `${prefix}SUCCESS`,
}

export const getProgrammesUnfiltered = () => {
  const route = '/v3/populationstatistics/studyprogrammes/unfiltered'
  return callController(route, prefix)
}

export const reducer = (state = { data: {} }, action) => {
  switch (action.type) {
    case types.attempt:
      return {
        pending: true,
        data: state.data,
      }
    case types.failure:
      return {
        pending: false,
        error: true,
        data: action.response,
      }
    case types.success:
      return {
        pending: false,
        error: false,
        data: action.response,
      }
    default:
      return state
  }
}
