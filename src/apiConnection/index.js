import axios from 'axios'

import { getToken, setToken, userIsMock } from '../common'
import { API_BASE_PATH, TOKEN_NAME, BASE_PATH } from '../constants'

const getAxios = () => axios.create({ baseURL: API_BASE_PATH })
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
  if (isDevEnv) {
    options = devOptions
  }
  if (isTestEnv) {
    options = testOptions
  }
  const response = await getAxios().post('/login', null, options)
  return response.data.token
}

export const superLogin = async (uid) => {
  let options = null
  if (isDevEnv) {
    options = devOptions
  }
  if (isTestEnv) {
    options = testOptions
  }
  const response = await getAxios().post(`/superlogin/${uid}`, null, options)
  console.log(`Setting new token ${response.data.token}`)
  await setToken(response.data.token)
}

export const returnToSelf = async () => {
  const token = await login()
  await setToken(token)
}

export const swapUser = async (uid) => {
  const token = await superLogin(uid)
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
  const token = await getToken()
  options.headers['x-access-token'] = token

  switch (method) {
    case 'get':
      return getAxios().get(url, { ...options, params })
    case 'post':
      return getAxios().post(url, data, options)
    case 'put':
      return getAxios().put(url, data, options)
    case 'delete':
      return getAxios().delete(url, { headers: options.headers, data })
    default:
      return Promise.reject(new Error('Invalid http method'))
  }
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
      try {
        const mock = await userIsMock()
        if (!mock) await getToken(true)
        const res = await callApi(route, method, data, params)
        store.dispatch({ type: `${prefix}SUCCESS`, response: res.data, query })
      } catch (err) {
        store.dispatch({ type: `${prefix}FAILURE`, response: err, query })
      }
    }
  }
}

export const logout = async () => {
  const stagingPath = '/staging'
  const returnUrl = window.location.pathname.includes(stagingPath) ?
    `${window.location.origin}${stagingPath}` : window.location.origin
  const response = await getAxios().delete('/logout', { data: { returnUrl } })
  localStorage.removeItem(TOKEN_NAME)
  window.location = response.data.logoutUrl
}

export const sendLog = async data => callApi('/log', 'post', data)
