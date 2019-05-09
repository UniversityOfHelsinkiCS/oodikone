import { callController } from '../apiConnection'

export const getDuplicates = (programme) => {
  const route = `/courses/duplicatecodes/${programme}`
  const prefix = 'GET_ALL_DUPLICATES_'
  return callController(route, prefix)
}

export const addDuplicate = (code1, code2) => {
  const route = `/courses/duplicatecodes/${code1}/${code2}`
  const prefix = 'ADD_DUPLICATE_'
  const method = 'post'
  return callController(route, prefix, {}, method)
}

export const removeDuplicate = (code) => {
  const route = `/courses/duplicatecodes/${code}`
  const prefix = 'REMOVE_DUPLICATE_'
  const method = 'delete'
  return callController(route, prefix, {}, method)
}

const reducer = (state = { data: {} }, action) => {
  switch (action.type) {
    case 'GET_ALL_DUPLICATES_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'GET_ALL_DUPLICATES_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'GET_ALL_DUPLICATES_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.code,
        data: action.response
      }
    case 'ADD_DUPLICATE_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'ADD_DUPLICATE_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'ADD_DUPLICATE_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.code,
        data: action.response
      }
    case 'REMOVE_DUPLICATE_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'REMOVE_DUPLICATE_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'REMOVE_DUPLICATE_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.code,
        data: action.response
      }
    default:
      return state
  }
}

export default reducer
