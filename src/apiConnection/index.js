import axios from 'axios'

import { getToken, setToken } from '../common'
import { API_BASE_PATH, TOKEN_NAME } from '../constants'

const getAxios = () => axios.create({ baseURL: API_BASE_PATH })
const isDevEnv = process.env.NODE_ENV === 'development'
const devOptions = {
  headers: {
    uid: 'tktl',
    displayName: 'Development Käyttäjä',
    'shib-session-id': 'mock-session'
  }
}

export const login = async () => {
  const options = isDevEnv ? devOptions : null
  const response = await getAxios().post('/login', null, options)
  return response.data.token
}

export const swapDevUser = async (newHeaders) => {
  devOptions.headers = { ...devOptions.headers, ...newHeaders }
  const token = await login()
  setToken(token)
}

const callApi = async (url, method = 'get', data) => {
  const options = isDevEnv ? devOptions : { headers: {} }
  const token = await getToken()
  options.headers['x-access-token'] = token

  switch (method) {
    case 'get':
      return getAxios().get(url, options)
    case 'post':
      return getAxios().post(url, data, options)
    case 'put':
      return getAxios().put(url, data, options)
    case 'delete':
      return getAxios().delete(url, options)
    default:
      return Promise.reject(new Error('Invalid http method'))
  }
}

export const callController = (route, prefix, data, method = 'get', query) => {
  const requestSettings = {
    route,
    method,
    data,
    prefix,
    query
  }
  return { type: `${prefix}ATTEMPT`, requestSettings }
}

export const handleRequest = store => next => async (action) => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const {
      route, method, data, prefix, query
    } = requestSettings
    try {
      const res = await callApi(route, method, data)
      store.dispatch({ type: `${prefix}SUCCESS`, response: res.data, query })
    } catch (e) {
      // Something failed. Assume it's the token and try again.
      try {
        await getToken(true)
        const res = await callApi(route, method, data)
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
