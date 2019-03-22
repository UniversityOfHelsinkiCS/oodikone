import { callController } from '../apiConnection/index'

const prefix = 'STUDYPROGRAMME_PRODUCTIVITY_'

export const getProductivity = (studyprogrammeId) => {
  const route = `v2/studyprogrammes/${studyprogrammeId}/productivity`
  return callController(route, prefix, [], 'get')
}

export const clearProductivity = () => ({
  type: `${prefix}_CLEAR`
})
const types = {
  attempt: `${prefix}ATTEMPT`,
  failure: `${prefix}FAILURE`,
  success: `${prefix}SUCCESS`,
  clear: `${prefix}CLEAR`
}

const initialState = { data: {}, error: false, pending: false }

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.attempt:
      return {
        ...state,
        pending: true
      }
    case types.failure:
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case types.success:
      return {
        pending: false,
        error: false,
        data: { ...state.data, ...action.response }
      }
    case types.clear:
      return initialState
    default:
      return state
  }
}

export default reducer
