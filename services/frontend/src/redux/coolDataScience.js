import { RTKApi, callController } from '../apiConnection'

export const getProtoC = ({ includeOldAttainments, excludeNonEnrolled, startYear, endYear }) => {
  const route = '/cool-data-science/proto-c-data'
  const prefix = 'GET_PROTOC_'
  const params = {
    include_old_attainments: includeOldAttainments,
    startYear,
    endYear,
    exclude_non_enrolled: excludeNonEnrolled,
  }
  return callController(route, prefix, [], 'get', null, params)
}

export const getProtoCProgramme = ({ includeOldAttainments, excludeNonEnrolled, startYear, endYear, code }) => {
  const route = '/cool-data-science/proto-c-data-programme'
  const prefix = 'GET_PROTOC_PROGRAMME_'
  const params = {
    include_old_attainments: includeOldAttainments,
    startYear,
    endYear,
    exclude_non_enrolled: excludeNonEnrolled,
    code,
  }
  return callController(route, prefix, [], 'get', null, params)
}

export const getStatus = ({ date, showByYear }) => {
  const route = '/cool-data-science/status'
  const prefix = 'GET_STATUS_'
  const params = { date, showByYear }
  return callController(route, prefix, [], 'get', null, params)
}

export const getUber = ({ startDate, includeOldAttainments }) => {
  const route = '/cool-data-science/uber-data'
  const prefix = 'GET_UBER_'
  const params = { start_date: startDate, include_old_attainments: includeOldAttainments }
  return callController(route, prefix, [], 'get', null, params)
}

export const getStatusGraduated = ({ date, showByYear }) => {
  const route = '/cool-data-science/status-graduated'
  const prefix = 'GET_GRADUATED_'
  const params = { date, showByYear }
  return callController(route, prefix, [], 'get', null, params)
}

export const getYears = () => {
  const route = '/cool-data-science/start-years'
  const prefix = 'GET_YEARS_'
  return callController(route, prefix)
}

const reducer = (
  state = {
    data: { protoC: {}, protoCProgramme: {}, status: {}, uber: [], years: [], graduated: {} },
    pending: { protoC: false, protoCProgramme: false, status: false, uber: false, years: false, graduated: false },
  },
  action
) => {
  switch (action.type) {
    case 'GET_PROTOC_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          protoC: {},
        },
        pending: {
          ...state.pending,
          protoC: true,
        },
      }
    case 'GET_PROTOC_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          protoC: {},
        },
        pending: {
          ...state.pending,
          protoC: false,
        },
      }
    case 'GET_PROTOC_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          protoC: action.response || {},
        },
        pending: {
          ...state.pending,
          protoC: false,
        },
      }
    case 'GET_PROTOC_PROGRAMME_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          protoCProgramme: {},
        },
        pending: {
          ...state.pending,
          protoCProgramme: true,
        },
      }
    case 'GET_PROTOC_PROGRAMME_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          protoCProgramme: {},
        },
        pending: {
          ...state.pending,
          protoCProgramme: false,
        },
      }
    case 'GET_PROTOC_PROGRAMME_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          protoCProgramme: action.response || {},
        },
        pending: {
          ...state.pending,
          protoCProgramme: false,
        },
      }
    case 'GET_STATUS_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          status: {},
        },
        pending: {
          ...state.pending,
          status: true,
        },
      }
    case 'GET_STATUS_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          status: {},
        },
        pending: {
          ...state.pending,
          status: false,
        },
      }
    case 'GET_STATUS_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          status: action.response || {},
        },
        pending: {
          ...state.pending,
          status: false,
        },
      }
    case 'GET_UBER_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          uber: [],
        },
        pending: {
          ...state.pending,
          uber: true,
        },
      }
    case 'GET_UBER_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          uber: [],
        },
        pending: {
          ...state.pending,
          uber: false,
        },
      }
    case 'GET_UBER_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          uber: action.response || [],
        },
        pending: {
          ...state.pending,
          uber: false,
        },
      }
    case 'GET_YEARS_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          years: [],
        },
        pending: {
          ...state.pending,
          years: true,
        },
      }
    case 'GET_YEARS_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          years: [],
        },
        pending: {
          ...state.pending,
          years: false,
        },
      }
    case 'GET_YEARS_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          years: action.response || [],
        },
        pending: {
          ...state.pending,
          years: false,
        },
      }
    case 'GET_GRADUATED_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          graduated: {},
        },
        pending: {
          ...state.pending,
          graduated: true,
        },
      }
    case 'GET_GRADUATED_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          graduated: {},
        },
        pending: {
          ...state.pending,
          graduated: false,
        },
      }
    case 'GET_GRADUATED_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          graduated: action.response || {},
        },
        pending: {
          ...state.pending,
          graduated: false,
        },
      }
    default:
      return state
  }
}

const coolDataScienceApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getProtoC: builder.query({
      query: ({ includeOldAttainments, excludeNonEnrolled, startYear, endYear }) => ({
        url: '/cool-data-science/proto-c-data',
        method: 'GET',
        params: {
          include_old_attainments: includeOldAttainments,
          exclude_non_enrolled: excludeNonEnrolled,
          startYear,
          endYear,
        },
      }),
    }),

    getProtoCProgramme: builder.query({
      query: ({ includeOldAttainments, excludeNonEnrolled, startYear, endYear, code }) => ({
        url: '/cool-data-science/proto-c-data-programme',
        method: 'GET',
        params: {
          include_old_attainments: includeOldAttainments,
          exclude_non_enrolled: excludeNonEnrolled,
          startYear,
          endYear,
          code,
        },
      }),
    }),
  }),
})

export const { useGetProtoCQuery, useGetProtoCProgrammeQuery } = coolDataScienceApi

export default reducer
