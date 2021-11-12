import axios from 'axios'
import * as Sentry from '@sentry/browser'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getMocked, setMocking } from '../common'
import { apiBasePath, isDev } from '../conf'
import { loginPrefix, logoutPrefix } from '../redux/auth'

export const getHeaders = () => {
  // Set up dev user for development environment, mimicking production admin user
  const devUserHeaders = {
    uid: 'mluukkai',
    displayName: 'Matti Luukkainen',
    'shib-session-id': 'mock-session',
    hyGroupCn: 'grp-oodikone-users;grp-oodikone-basic-users',
    eduPersonAffiliation: 'member;employee;faculty',
    mail: 'grp-toska+mockmluukkai@helsinki.fi',
    hyPersonSisuId: 'hy-hlo-1441871',
  }
  return isDev ? { ...devUserHeaders } : {}
}

export const api = axios.create({ baseURL: apiBasePath, headers: getHeaders() })

export const actionSuffixes = {
  attempt: `ATTEMPT`,
  failure: `FAILURE`,
  success: `SUCCESS`,
}

export const actionTypes = prefix => ({
  attempt: `${prefix}${actionSuffixes.attempt}`,
  failure: `${prefix}${actionSuffixes.failure}`,
  success: `${prefix}${actionSuffixes.success}`,
})

export const logout = async () => {
  setMocking(null)
  const returnUrl = window.location.origin
  const response = await api.delete('/logout', { data: { returnUrl } })
  window.location = response.data.logoutUrl
}

export const callApi = async (url, method = 'get', data, params, timeout = 0, progressCallback = null) => {
  const options = { headers: getHeaders(), timeout }

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
    onProgress,
  }
  const { attempt } = actionTypes(prefix)
  return { type: attempt, requestSettings }
}

const handleError = (err, actionHistory = []) => {
  const { response } = err
  if (response && response.status) {
    Sentry.withScope(s => {
      s.setExtra('config', err.config)
      s.setExtra('request', err.request)
      s.setExtra('response', err.response)
      s.setExtra('actionHistory', JSON.stringify(actionHistory))
      Sentry.captureException(err)
    })
  }
}

export const handleRequest = store => next => async action => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const { route, method, data, prefix, query, params, onProgress } = requestSettings
    const { success, failure } = actionTypes(prefix)
    try {
      const res = await callApi(route, method, data, params, 0, onProgress)
      store.dispatch({ type: success, response: res.data, query })
    } catch (e) {
      store.dispatch({ type: failure, response: e, query })
      handleError(e, store.getState().actionHistory)
    }
  }
}

export const handleAuth = store => next => async action => {
  const loginTypes = actionTypes(loginPrefix)
  const logoutTypes = actionTypes(logoutPrefix)
  next(action)
  const { type } = action
  if (type === loginTypes.attempt) {
    const { success, failure } = loginTypes
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
        'x-access-token': token,
      }
      store.dispatch({ type: success, token })
    } catch (err) {
      store.dispatch({ type: failure })
      handleError(err, store.getState().actionHistory)
    }
  } else if (type === loginTypes.attempt) {
    const { success, failure } = logoutTypes
    try {
      await logout()
      store.dispatch({ type: success })
    } catch (err) {
      store.dispatch({ type: failure })
      handleError(err, store.getState().actionHistory)
    }
  }
}

// Redux-toolkit query based API
// Api can be extended with enhanceEndpoints method
// All tags used for invalidating cache must be defined here
export const RTKApi = createApi({
  reducerPath: 'api',
  tagTypes: ['StudyGuidanceGroups'],
  baseQuery: fetchBaseQuery({
    baseUrl: apiBasePath,
    prepareHeaders: (headers, { getState }) => {
      // Get token from state and add it to headers
      const token = getState().auth.encodedToken
      if (token) headers.set('x-access-token', token)
      // Add possible default headers
      Object.entries(getHeaders()).forEach(([key, value]) => headers.set(key, value))
      return headers
    },
  }),
  endpoints: () => ({}),
})
