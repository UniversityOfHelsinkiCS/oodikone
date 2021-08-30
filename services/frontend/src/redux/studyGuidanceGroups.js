import { callController } from '../apiConnection'

const prefix = 'GET_STUDY_GUIDANCE_GROUPS_'

export const getStudyGuidanceGroups = () => {
  const route = '/studyguidancegroups'
  return callController(route, prefix)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case `${prefix}ATTEMPT`:
      return {
        ...state,
        pending: true,
      }
    case `${prefix}FAILURE`:
      return {
        ...state,
        pending: false,
        error: true,
      }
    case `${prefix}SUCCESS`:
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
      }
    default:
      return state
  }
}

export default reducer
