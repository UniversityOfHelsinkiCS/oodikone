import { callController } from '../apiConnection'

export const sendFeedbackAction = (content) => {
  const route = '/feedback/email'
  const prefix = 'SEND_FEEDBACK_'
  const data = { content }
  const method = 'post'

  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [], enabledOnly: true, success: false, pending: false, error: false }, action) => {
  switch (action.type) {
    case 'SEND_FEEDBACK_ATTEMPT':
      return {
        ...state,
        success: false,
        pending: true,
        error: false
      }
    case 'SEND_FEEDBACK_SUCCESS':
      return {
        ...state,
        success: true,
        pending: false,
        error: false
      }
    case 'SEND_FEEDBACK_FAILURE':
      return {
        ...state,
        success: false,
        pending: false,
        error: true
      }
    default:
      return state
  }
}

export default reducer
