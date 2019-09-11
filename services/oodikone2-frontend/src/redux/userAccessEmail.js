import { combineReducers } from 'redux'
import { callController, actionTypes } from '../apiConnection'

const sendingPrefix = 'SEND_USER_ACCESS_EMAIL_'
const sendingTypes = {
  ...actionTypes(sendingPrefix),
  clear: `${sendingPrefix}CLEAR`
}

export const sendEmail = (recipientAddress) => {
  const route = '/users/email'
  const data = { email: recipientAddress }
  const method = 'post'
  return callController(route, sendingPrefix, data, method)
}

export const clearError = () => ({
  type: sendingTypes.clear
})

const sendingPending = (state = false, action) => {
  switch (action.type) {
    case sendingTypes.attempt:
      return true
    case sendingTypes.success:
    case sendingTypes.failure:
      return false
    default:
      return state
  }
}

const sendingError = (state = null, action) => {
  switch (action.type) {
    case sendingTypes.attempt:
    case sendingTypes.success:
    case sendingTypes.clear:
      return null
    case sendingTypes.failure:
      return action.response.response.data.error
    default:
      return state
  }
}

const sending = combineReducers({
  pending: sendingPending,
  error: sendingError
})

export default combineReducers({
  sending
})
