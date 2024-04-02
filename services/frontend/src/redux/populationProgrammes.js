import { callController } from '@/apiConnection'

const prefix = 'GET_POPULATIONS_PROGRAMMES_'

const types = {
  attempt: `${prefix}ATTEMPT`,
  failure: `${prefix}FAILURE`,
  success: `${prefix}SUCCESS`,
}

export const getProgrammes = () => {
  const route = '/v3/populationstatistics/studyprogrammes'
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
