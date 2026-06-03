import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import axios, { AxiosProgressEvent } from 'axios'

import { showAsUserKey } from '@/common'
import { apiBasePath, isDev } from '@/conf'
import { queryParamsToString } from '@/util/queryparams'

// Set up dev user for development environment, mimicking production admin user
const baseHeaders = isDev
  ? {
      uid: 'mluukkai',
      displayName: 'Matti Luukkainen',
      'shib-session-id': 'mock-session',
      hyGroupCn: 'grp-oodikone-users;grp-oodikone-basic-users;grp-toska',
      mail: 'grp-toska+mockmluukkai@helsinki.fi',
      hyPersonSisuId: 'hy-hlo-1441871',
      shib_logout_url: 'https://helsinki.fi/shibboleth-sp/Logout',
      remote_user: 'mluukkai',
    }
  : {}

const getHeaders = () => {
  const headers = structuredClone(baseHeaders)

  // Set up possible show as user -headers
  const showAsUser = window.localStorage.getItem(showAsUserKey)
  if (showAsUser) headers['x-show-as-user'] = showAsUser

  return headers
}

const api = axios.create({ baseURL: apiBasePath, headers: getHeaders(), timeout: 120_000 })

export const callApi = async (
  url,
  method = 'get',
  data?,
  params = {},
  timeout = 0,
  progressCallback?: (progress: number) => void
) => {
  const options = { headers: getHeaders(), timeout }

  const onDownloadProgress = ({ loaded, total }: AxiosProgressEvent) => {
    if (progressCallback) progressCallback(Math.min(100, Math.round((loaded / (total ?? 1)) * 100)))
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
    paramsSerializer: params => queryParamsToString(params),
  }),
  endpoints: () => ({}),
})
