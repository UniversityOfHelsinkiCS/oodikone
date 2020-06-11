import { callController } from '../apiConnection'

export const getProtoC = ({ includeOldAttainments, excludeNonEnrolled }) => {
  const route = '/cool-data-science/proto-c-data'
  const prefix = 'GET_PROTOC_'
  const params = { include_old_attainments: includeOldAttainments, exclude_non_enrolled: excludeNonEnrolled }
  return callController(route, prefix, [], 'get', null, params)
}

export const getProtoCProgramme = ({ includeOldAttainments, excludeNonEnrolled, code }) => {
  const route = '/cool-data-science/proto-c-data-programme'
  const prefix = 'GET_PROTOC_PROGRAMME_'
  const params = { include_old_attainments: includeOldAttainments, exclude_non_enrolled: excludeNonEnrolled, code }
  return callController(route, prefix, [], 'get', null, params)
}

export const getStatus = ({ date, showByYear }) => {
  const route = '/cool-data-science/status'
  const prefix = 'GET_STATUS_'
  const params = { date, showByYear }
  return callController(route, prefix, [], 'get', null, params)
}

const reducer = (
  state = {
    data: { protoC: {}, protoCProgramme: {}, status: {}, uber: {} },
    pending: { protoC: false, protoCProgramme: false, status: false, uber: false }
  },
  action
) => {
  switch (action.type) {
    case 'GET_PROTOC_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          protoC: {}
        },
        pending: {
          ...state.pending,
          protoC: true
        }
      }
    case 'GET_PROTOC_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          protoC: {}
        },
        pending: {
          ...state.pending,
          protoC: false
        }
      }
    case 'GET_PROTOC_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          protoC: action.response || {}
        },
        pending: {
          ...state.pending,
          protoC: false
        }
      }
    case 'GET_PROTOC_PROGRAMME_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          protoCProgramme: {}
        },
        pending: {
          ...state.pending,
          protoCProgramme: true
        }
      }
    case 'GET_PROTOC_PROGRAMME_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          protoCProgramme: {}
        },
        pending: {
          ...state.pending,
          protoCProgramme: false
        }
      }
    case 'GET_PROTOC_PROGRAMME_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          protoCProgramme: action.response || {}
        },
        pending: {
          ...state.pending,
          protoCProgramme: false
        }
      }
    case 'GET_STATUS_ATTEMPT':
      return {
        ...state,
        data: {
          ...state.data,
          status: {}
        },
        pending: {
          ...state.pending,
          status: true
        }
      }
    case 'GET_STATUS_FAILED':
      return {
        ...state,
        data: {
          ...state.data,
          status: {}
        },
        pending: {
          ...state.pending,
          status: false
        }
      }
    case 'GET_STATUS_SUCCESS':
      return {
        ...state,
        data: {
          ...state.data,
          status: action.response || {}
        },
        pending: {
          ...state.pending,
          status: false
        }
      }
    default:
      return state
  }
}

export default reducer
