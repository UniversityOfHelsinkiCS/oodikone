import axios from 'axios'
import { API_BASE_PATH } from '../constants'

const isDevEnv = process.env.NODE_ENV === 'development'

const getAxios = () => axios.create({ baseURL: API_BASE_PATH })

const callApi = (url, method = 'get', data) => {
  const options = {
    headers: {
      'x-access-token': localStorage.getItem('oodi_token')
    }
  }
  if (isDevEnv) {
    const devUser = 'tktl'
    options.headers.eduPersonPrincipalName = `${devUser}@ad.helsinki.fi`
    options.headers['shib-session-id'] = 'mock-session'
  }
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
