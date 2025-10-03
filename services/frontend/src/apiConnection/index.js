import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as Sentry from '@sentry/browser'
import axios from 'axios'

import { showAsUserKey } from '@/common'
import { apiBasePath, isDev } from '@/conf'
import { formatToArray } from '@oodikone/shared/util'

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
    remote_user: 'mluukkai',
  }
  const headers = isDev ? { ...devUserHeaders } : {}

  // Set up possible show as user -headers
  const showAsUser = window.localStorage.getItem(showAsUserKey)
  if (showAsUser) headers['x-show-as-user'] = showAsUser

  return headers
}

const api = axios.create({ baseURL: apiBasePath, headers: getHeaders(), timeout: 120_000 })

const actionTypes = prefix => ({
  attempt: `${prefix}ATTEMPT`,
  failure: `${prefix}FAILURE`,
  success: `${prefix}SUCCESS`,
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

const handleError = (error, actionHistory = []) => {
  const { config, request, response } = error
  if (response && response.status) {
    Sentry.withScope(scope => {
      scope.setExtra('config', config)
      scope.setExtra('request', request)
      scope.setExtra('response', response)
      scope.setExtra('actionHistory', JSON.stringify(actionHistory))

      Sentry.captureException(error)
    })
  }
}

export const handleRequest = store => next => async action => {
  if (action.requestSettings) {
    const { success, failure } = actionTypes(prefix)
    const { route, method, data, prefix, query, params, onProgress } = action.requestSettings

    // Based no the previous config. We don't actually care when this finishes.
    void callApi(route, method, data, params, 0, onProgress)
      .then(res => store.dispatch({ type: success, response: res.data, query }))
      .catch(error => {
        // Handle error first to avoid redux minified error #3 in production.
        // We don't need to add the error to the actionHistory as it is already passed to Sentry.
        handleError(error, store.getState().actionHistory)
        store.dispatch({ type: failure, response: error, query })
      })
  }

  next(action)
}

// Redux-toolkit query based API
// Api can be extended with enhanceEndpoints method
// All tags used for invalidating cache must be defined here
export const RTKApi = createApi({
  reducerPath: 'api',
  tagTypes: [
    'CompletedCoursesSearchList',
    'CustomPopulationSearches',
    'ProgressCriteria',
    'Semester',
    'Students',
    'StudentTags',
    'StudyGuidanceGroups',
    'StudyProgrammePins',
    'Tags',
    'Users',
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: apiBasePath,
    prepareHeaders: headers => {
      // Add possible default headers
      Object.entries(getHeaders()).forEach(([key, value]) => headers.set(key, value))
      return headers
    },
    paramsSerializer: params => {
      const searchParams = new URLSearchParams()

      Object.entries(params).map(([key, val]) => {
        const subfix = Array.isArray(val) ? '[]' : ''
        formatToArray(val).forEach(item => searchParams.append(key + subfix, item))
      })

      return searchParams.toString()
    },
  }),
  endpoints: () => ({}),
})
