import { actionTypes } from '../../apiConnection'

const itemreducer = (prefix, initial) => {
  const types = actionTypes(prefix)
  const initialState = {
    pending: false,
    error: false,
    data: [],
    ...initial
  }
  return (state = initialState, action) => {
    switch (action.type) {
      case types.attempt:
        return {
          ...state,
          error: false,
          pending: true
        }
      case types.failure:
        return {
          ...state,
          pending: false,
          error: true
        }
      case types.success:
        return {
          ...state,
          pending: false,
          error: false,
          data: action.response
        }
      default:
        return state
    }
  }
}

export default itemreducer
