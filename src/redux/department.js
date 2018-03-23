import { callController } from '../apiConnection'

export const getDepartmentSuccess = (date) => {
  const route = `/departmentsuccess/?date=${date}`
  const prefix = 'GET_DEPARTMENT_'
  return callController(route, prefix)
}

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'GET_DEPARTMENT_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data
      }
    case 'GET_DEPARTMENT_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'GET_DEPARTMENT_SUCCESS':
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
