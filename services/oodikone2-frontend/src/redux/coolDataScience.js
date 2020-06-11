import { callController } from '../apiConnection'

export const getProtoC = ({ includeOldAttainments, excludeNonEnrolled }) => {
  const route = '/cool-data-science/proto-c-data'
  const prefix = 'GET_PROTOC_'
  const query = { include_old_attainments: includeOldAttainments, exclude_non_enrolled: excludeNonEnrolled }
  return callController(route, prefix, [], 'get', query)
}

export const getProtoCProgramme = ({ includeOldAttainments, excludeNonEnrolled, code }) => {
  const route = '/cool-data-science/proto-c-data-programme'
  const prefix = 'GET_PROTOC_PROGRAMME_'
  const query = { include_old_attainments: includeOldAttainments, exclude_non_enrolled: excludeNonEnrolled, code }
  return callController(route, prefix, [], 'get', query)
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
    default:
      return state
  }
}

export default reducer
