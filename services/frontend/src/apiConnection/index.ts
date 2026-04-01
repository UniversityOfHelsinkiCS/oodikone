import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { showAsUserKey } from '@/common'
import { apiBasePath, isDev } from '@/conf'
import { formatToArray } from '@oodikone/shared/util'
import { Fetchios } from '@oodikone/shared/util/fetchios'

// Set up dev user for development environment, mimicking production admin user
const baseHeaders: Record<string, string> = isDev
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

const api = Fetchios.create({ baseUrl: apiBasePath })

type ApiMethods = 'get' | 'post' | 'put' | 'delete'

/**
 * Calls API with minimal preprocessing.
 * NOTE! `data` -attribute has to be JSON.stringified in-order for the predefined
 *       'Content-Type' to work and the receiving Express instance to parse the body correctly.
 */
export const callApi = async (
  url: string,
  method: ApiMethods = 'get',
  data?: BodyInit,
  params: Record<string, any> = {},
  timeout = 30_000
) => {
  const apiRequestController = new AbortController()
  const signal = timeout !== 0 ? apiRequestController.signal : undefined

  const options = {
    params,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
  }

  // const buildUrl = () => e{
  //   const urlParams = new URLSearchParams(params)
  //   return apiBasePath + url + urlParams.toString()
  // }

  switch (method) {
    case 'get':
      return api.get(url, options)
    case 'post':
      return api.post(url, data, options)
    case 'put':
      return api.put(url, data, options)
    case 'delete':
      return api.delete(url, options)
    default:
      throw new Error('Invalid method used for API call.')
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
