import { actionTypes } from '../../apiConnection'

const additionalTypes = prefix => ({
  reset: `${prefix}_CLEAR`
})

const createReducer = (prefix, {
  reduceGET = (_, action) => action.response,
  reducePOST = (data, action) => data.concat(action.response),
  reduceDELETE = (data, action) => data.filter(d => d.id === action.query.id),
  defaults = undefined
}) => {
  const prefixGET = `${prefix}GET_`
  const prefixPOST = `${prefix}POST_`
  const prefixDELETE = `${prefix}DELETE_`
  const read = actionTypes(prefixGET)
  const create = actionTypes(prefixPOST)
  const destroy = actionTypes(prefixDELETE)
  const other = additionalTypes(prefix)
  const initialState = {
    pending: false,
    error: false,
    data: [],
    ...defaults
  }
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case destroy.attempt:
      case create.attempt:
      case read.attempt:
        return {
          ...state,
          error: false,
          pending: true
        }
      case destroy.failure:
      case create.failure:
      case read.failure:
        return {
          ...state,
          error: true,
          pending: false
        }
      case read.success:
        return {
          ...state,
          data: reduceGET(state.data, action),
          error: false,
          pending: false
        }
      case create.success:
        return {
          ...state,
          data: reducePOST(state.data, action),
          error: false,
          pending: false
        }
      case destroy.success:
        return {
          ...state,
          data: reduceDELETE(state.data, action),
          error: false,
          pending: false
        }
      case other.reset: {
        return {
          ...initialState
        }
      }
      default:
        return state
    }
  }
  return {
    reducer, prefixGET, prefixPOST, prefixDELETE
  }
}

export default createReducer
