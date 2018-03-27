import axios from 'axios'
import jwtDecode from 'jwt-decode'

import { API_BASE_PATH } from '../constants'

const TOKEN_NAME = 'token'
const isDevEnv = process.env.NODE_ENV === 'development'
const getAxios = () => axios.create({ baseURL: API_BASE_PATH })
const tokenExpired = token => jwtDecode(token).exp > new Date().getTime()

const checkAuth = async (options) => {
  const auth = {}
  auth.token = localStorage.getItem(TOKEN_NAME)
  if (!auth.token || tokenExpired(auth.token)) {
    const response = await getAxios().get('/login', options)
    auth.token = response.data.token
    localStorage.setItem(TOKEN_NAME, auth.token)
  }
  return auth
}

const callApi = async (url, method = 'get', data) => {
  const options = { headers: {} }
  if (isDevEnv) {
    const uid = 'tktl' // TODO: Other development users
    const displayName = 'Development Käyttäjä'
    options.headers.uid = uid
    options.headers.displayName = displayName
    options.headers['shib-session-id'] = 'mock-session'
  }
  const auth = await checkAuth(options)
  options.headers['x-access-token'] = auth.token

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
  // TODO: send logout request and handle it
  // const response = await getAxios('/logout')
  localStorage.removeItem(TOKEN_NAME)
  window.location = '/'
}
