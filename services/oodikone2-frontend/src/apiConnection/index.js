import axios from 'axios'
import * as Sentry from '@sentry/browser'
import { getToken, setToken, getAsUserWithoutRefreshToken, getTokenWithoutRefresh } from '../common'
import { API_BASE_PATH, TOKEN_NAME, BASE_PATH, ERROR_STATUSES_TO_CAPTURE } from '../constants'
import { login as loginAction } from '../redux/auth'

const isTestEnv = BASE_PATH === '/testing/'
const isDevEnv = process.env.NODE_ENV === 'development'
const devOptions = {
  headers: {
    uid: 'tktl',
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

export const login = async () => {
  let options = null
  console.log(isDevEnv)
  if (isDevEnv) {
    options = devOptions
  }
  if (isTestEnv) {
    options = testOptions
  }
  const response = await api.post('/login', null, options)
  return response.data.token
}

export const logout = async () => {
  const returnUrl = window.location.origin
  const response = await api.delete('/logout', { data: { returnUrl } })
  localStorage.removeItem(TOKEN_NAME)
  window.location = response.data.logoutUrl
}

export const returnToSelf = async () => {
  const token = await login()
  await setToken(token)
}

export const callApi = async (url, method = 'get', data, params, timeout = 0) => {
  let options = { headers: {}, timeout }
  if (isDevEnv) {
    options = devOptions
  }
  if (isTestEnv) {
    options = testOptions
  }

  switch (method) {
    case 'get':
      return api.get(url, { ...options, params })
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

export const superLogin = async (uid) => {
  const response = await callApi(`/superlogin/${uid}`, 'post')
  const { token } = response.data
  console.log(`Setting new token ${token}`)
  await setToken(token)
  return token
}

export const callController = (route, prefix, data, method = 'get', query, params) => {
  const requestSettings = {
    route,
    method,
    data,
    prefix,
    query,
    params
  }
  return { type: `${prefix}ATTEMPT`, requestSettings }
}

export const handleRequest = store => next => async (action) => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const {
      route, method, data, prefix, query, params
    } = requestSettings
    try {
      const res = await callApi(route, method, data, params)
      store.dispatch({ type: `${prefix}SUCCESS`, response: res.data, query })
    } catch (e) {
      // Something failed. Assume it's the token and try again.
      store.dispatch(loginAction(true, requestSettings))
    }
  }
}

const handleError = (err) => {
  const { response } = err
  if (response && response.status) {
    if (ERROR_STATUSES_TO_CAPTURE.includes(response.status)) {
      Sentry.captureException(err)
    }
  }
}

export const handleAuth = store => next => async (action) => {
  next(action)
  const { type, force = false, retryRequestSettings, uid, refresh } = action
  const {
    route, method, data, prefix, query, params
  } = retryRequestSettings || {}
  if (type === 'LOGIN_SUCCESS' && refresh) window.location.reload()
  if (type === 'LOGIN_ATTEMPT') {
    try {
      const mock = await getAsUserWithoutRefreshToken()
      let token
      if (mock && !uid) token = getTokenWithoutRefresh()
      else if (uid) token = await superLogin(uid)
      else token = await getToken(force)

      api.defaults.headers.common = {
        ...api.defaults.headers.common,
        'x-access-token': token
      }
      store.dispatch({ type: 'LOGIN_SUCCESS', token, refresh: uid })
      try {
        if (retryRequestSettings) {
          const res = await callApi(route, method, data, params)
          store.dispatch({ type: `${prefix}SUCCESS`, response: res.data, query })
        }
      } catch (err) {
        store.dispatch({ type: `${prefix}FAILURE`, response: err, query })
        handleError(err)
      }
    } catch (err) {
      store.dispatch({ type: 'LOGIN_FAILURE' })
      if (retryRequestSettings) {
        store.dispatch({ type: `${prefix}FAILURE`, response: err, query })
        handleError(err)
      }
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
