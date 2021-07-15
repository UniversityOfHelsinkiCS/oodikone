import { combineReducers } from 'redux'
import { callController, actionTypes } from '../apiConnection'

const CLEAR_USER_ACCESS_ERRORS = 'CLEAR_USER_ACCESS_ERRORS'

const sendingPrefix = 'SEND_USER_ACCESS_EMAIL_'
const sendingTypes = actionTypes(sendingPrefix)

const previewPrefix = 'GET_USER_ACCESS_EMAIL_PREVIEW_'
const previewTypes = actionTypes(previewPrefix)

export const sendEmail = recipientAddress => {
  const route = '/users/email'
  const data = { email: recipientAddress }
  const method = 'post'
  return callController(route, sendingPrefix, data, method)
}

export const getPreview = () => {
  const route = '/users/email/preview'
  return callController(route, previewPrefix)
}

export const clearErrors = () => ({
  type: CLEAR_USER_ACCESS_ERRORS,
})

const extractAxiosError = response => response.data && (response.data.error || response.data)

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
    case CLEAR_USER_ACCESS_ERRORS:
      return null
    case sendingTypes.failure:
      return extractAxiosError(action.response.response)
    default:
      return state
  }
}

const previewData = (state = null, action) => {
  switch (action.type) {
    case previewTypes.success: {
      const { subject, html } = action.response
      return { subject, html }
    }
    case previewTypes.failure:
      return null
    default:
      return state
  }
}

const previewPending = (state = false, action) => {
  switch (action.type) {
    case previewTypes.attempt:
      return true
    case previewTypes.success:
    case previewTypes.failure:
      return false
    default:
      return state
  }
}

const previewError = (state = null, action) => {
  switch (action.type) {
    case previewTypes.attempt:
    case previewTypes.success:
    case CLEAR_USER_ACCESS_ERRORS:
      return null
    case previewTypes.failure:
      return extractAxiosError(action.response.response)
    default:
      return state
  }
}

const sending = combineReducers({
  pending: sendingPending,
  error: sendingError,
})

const preview = combineReducers({
  pending: previewPending,
  error: previewError,
  data: previewData,
})

export default combineReducers({
  sending,
  preview,
})
