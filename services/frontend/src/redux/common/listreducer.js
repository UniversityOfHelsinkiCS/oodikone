import { actionTypes } from '../../apiConnection'

const additionalTypes = prefix => ({
  reset: `${prefix}_CLEAR`,
})

export const listreducer = (prefix, resToObject, rewriteData = true) => {
  const types = {
    ...actionTypes(prefix),
    ...additionalTypes(prefix),
  }
  const initialState = {
    pending: false,
    error: false,
    data: {},
    query: undefined,
  }
  return (state = initialState, action) => {
    switch (action.type) {
      case types.attempt:
        return {
          ...state,
          error: false,
          pending: true,
          query: undefined,
        }
      case types.failure:
        return {
          ...state,
          error: true,
          pending: false,
          query: undefined,
        }
      case types.success: {
        const additions = resToObject ? resToObject(action.response) : action.response
        const data = !rewriteData ? { ...state.data, ...additions } : additions
        return {
          ...state,
          error: false,
          pending: false,
          data,
          query: action.query,
        }
      }
      case types.reset: {
        return {
          ...initialState,
        }
      }
      default:
        return state
    }
  }
}

export const actions = prefix => {
  const types = additionalTypes(prefix)
  return {
    reset: () => ({ type: types.reset }),
  }
}
