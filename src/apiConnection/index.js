import axios from 'axios'

import { tokenInvalid, decodeToken } from '../common'
import { API_BASE_PATH, TOKEN_NAME } from '../constants'

const isDevEnv = process.env.NODE_ENV === 'development'
const devOptions = {
  headers: {
    uid: 'tktl',
    displayName: 'Development Käyttäjä',
    'shib-session-id': 'mock-session'
  }
}

const getAxios = () => axios.create({ baseURL: API_BASE_PATH })

export const checkAuth = async () => {
  const options = isDevEnv ? devOptions : null
  const token = localStorage.getItem(TOKEN_NAME)
  if (!token || tokenInvalid(token) || !decodeToken(token).enabled) {
    const response = await getAxios().get('/login', options)
    localStorage.setItem(TOKEN_NAME, response.data.token)
    return response.data.token
  }
  return token
}

const callApi = async (url, method = 'get', data) => {
  const options = isDevEnv ? devOptions : { headers: {} }
  const token = await checkAuth()
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
    } catch (err) {
      store.dispatch({ type: `${prefix}FAILURE`, response: err, query })
    }
  }
}

export const logout = async () => {
  const returnUrl = window.location.origin
  const response = await getAxios().get(`/logout?returnUrl=${returnUrl}`)
  localStorage.removeItem(TOKEN_NAME)
  window.location = response.data.logoutUrl
}
