import axios from 'axios'
import * as Sentry from '@sentry/browser'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { showAsUserKey } from 'common'
import { apiBasePath, isDev } from '../conf'

const getHeaders = () => {
  // Set up dev user for development environment, mimicking production admin user
  const devUserHeaders = {
    uid: 'mluukkai',
    displayName: 'Matti Luukkainen',
    'shib-session-id': 'mock-session',
    hyGroupCn: 'grp-oodikone-users;grp-oodikone-basic-users;grp-toska',
    mail: 'grp-toska+mockmluukkai@helsinki.fi',
    hyPersonSisuId: 'hy-hlo-1441871',
    shib_logout_url: 'https://helsinki.fi/shibboleth-sp/Logout',
  }
  const headers = isDev ? { ...devUserHeaders } : {}

  // Set up possible show as user -headers
  const showAsUser = window.localStorage.getItem(showAsUserKey)
  if (showAsUser) headers['x-show-as-user'] = showAsUser

  return headers
}

const api = axios.create({ baseURL: apiBasePath, headers: getHeaders(), timeout: 120_000 })

const actionSuffixes = {
  attempt: 'ATTEMPT',
  failure: 'FAILURE',
  success: 'SUCCESS',
}

export const actionTypes = prefix => ({
  attempt: `${prefix}${actionSuffixes.attempt}`,
  failure: `${prefix}${actionSuffixes.failure}`,
  success: `${prefix}${actionSuffixes.success}`,
})

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

// Redux-toolkit query based API
// Api can be extended with enhanceEndpoints method
// All tags used for invalidating cache must be defined here
export const RTKApi = createApi({
  reducerPath: 'api',
  tagTypes: ['StudyGuidanceGroups', 'Semester', 'CustomPopulationSearches'],
  baseQuery: fetchBaseQuery({
    baseUrl: apiBasePath,
    prepareHeaders: headers => {
      // Add possible default headers
      Object.entries(getHeaders()).forEach(([key, value]) => headers.set(key, value))
      return headers
    },
  }),
  endpoints: () => ({}),
})
