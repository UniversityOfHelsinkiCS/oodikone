import axios from 'axios'
import * as Sentry from '@sentry/browser'
import { API_BASE_PATH, BASE_PATH, ERROR_STATUSES_NOT_TO_CAPTURE } from '../constants'
import { getMocked, setMocking, setTestUser, getTestUser } from '../common'

const isTestEnv = BASE_PATH === '/testing/'
const isDevEnv = process.env.NODE_ENV === 'development'
const devOptions = {
  headers: {
    uid: getTestUser() || 'tktl',
    displayName: 'Development Kayttaja',
    'shib-session-id': 'mock-session'
  }
}

const testOptions = {
  headers: {
    uid: 'tester',
    displayName: 'Testing Käyttäjä',
    'shib-session-id': 'mock-session'
  }
}

const getDefaultConfig = () => {
  if (isTestEnv) {
    return { ...testOptions }
  } else if (isDevEnv) {
    return { ...devOptions }
  }
  return {
    headers: {}
  }
}

const createDefaultAxiosConfig = () => {
  const config = getDefaultConfig()
  config.baseURL = API_BASE_PATH
  return config
}

export const api = axios.create({ ...createDefaultAxiosConfig() })

const types = {
  attempt: prefix => `${prefix}ATTEMPT`,
  failure: prefix => `${prefix}FAILURE`,
  success: prefix => `${prefix}SUCCESS`
}

export const actionTypes = prefix => ({
  attempt: types.attempt(prefix),
  failure: types.failure(prefix),
  success: types.success(prefix)
})

export const logout = async () => {
  setMocking(null)
  setTestUser(null)
  const returnUrl = window.location.origin
  const response = await api.delete('/logout', { data: { returnUrl } })
  window.location = response.data.logoutUrl
}

export const callApi = async (url, method = 'get', data, params, timeout = 0, progressCallback = null) => {
  let options = { headers: {}, timeout }
  if (isDevEnv) {
    options = devOptions
  }
  if (isTestEnv) {
    options = testOptions
  }

  const onDownloadProgress = ({ loaded, total }) => {
    if (progressCallback) progressCallback(Math.round((loaded / total) * 100))
  }

  switch (method) {
    case 'get':
      return api.get(url, { ...options, params, onDownloadProgress })
    case 'post':
      return api.post(url, data, options)
    case 'put':
      return api.put(url, data, options)
    case 'delete':
      return api.delete(url, { headers: options.headers, data })
    default:
      return Promise.reject(new Error('Invalid http method'))
  }
}

export const callController = (route, prefix, data, method = 'get', query, params, onProgress = null) => {
  const requestSettings = {
    route,
    method,
    data,
    prefix,
    query,
    params,
    onProgress
  }
  return { type: `${prefix}ATTEMPT`, requestSettings }
}

const handleError = (err) => {
  const { response } = err
  if (response && response.status) {
    if (!ERROR_STATUSES_NOT_TO_CAPTURE.includes(response.status)) {
      Sentry.captureException(err)
    }
  }
}

export const handleRequest = store => next => async (action) => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const {
      route, method, data, prefix, query, params, onProgress
    } = requestSettings
    try {
      const res = await callApi(
        route,
        method,
        data,
        params,
        0,
        onProgress
      )
      store.dispatch({ type: `${prefix}SUCCESS`, response: res.data, query })
    } catch (e) {
      store.dispatch({ type: `${prefix}FAILURE`, response: e, query })
      handleError(e)
    }
  }
}

export const handleAuth = store => next => async (action) => {
  next(action)
  const { type } = action
  if (type === 'LOGIN_ATTEMPT') {
    try {
      let token
      const mocked = getMocked()
      if (mocked) {
        token = (await callApi(`/superlogin/${mocked}`, 'post')).data
      } else {
        // eslint-disable-next-line prefer-destructuring
        token = (await callApi('/login', 'post')).data.token
      }

      api.defaults.headers.common = {
        ...api.defaults.headers.common,
        'x-access-token': token
      }
      store.dispatch({ type: 'LOGIN_SUCCESS', token })
    } catch (err) {
      store.dispatch({ type: 'LOGIN_FAILURE' })
      handleError(err)
    }
  } else if (type === 'LOGOUT_ATTEMPT') {
    try {
      await logout()
      store.dispatch({ type: 'LOGOUT_SUCCESSFUL' })
    } catch (err) {
      store.dispatch({ type: 'LOGOUT_FAILURE' })
      handleError(err)
    }
  }
}

export const sendLog = async data => callApi('/log', 'post', data)
