import { callController, actionTypes } from '../apiConnection'

const getPrefix = 'GET_STUDY_GUIDANCE_GROUPS_'
const getTypes = {
  ...actionTypes(getPrefix),
}

export const getStudyGuidanceGroups = () => {
  const route = '/studyguidancegroups'
  return callController(route, getPrefix)
}

const changeTagsPrefix = 'CHANGE_STUDY_GUIDANCE_GROUP_TAGS_'
const changeTagsTypes = {
  ...actionTypes(changeTagsPrefix),
}

export const changeStudyGuidanceGroupTags = (groupId, tags) => {
  const route = `/studyguidancegroups/${groupId}/tags`
  return callController(route, changeTagsPrefix, tags, 'put')
}
const initialState = {
  pending: false,
  error: false,
  data: [],
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case getTypes.attempt:
      return {
        ...state,
        error: false,
        pending: true,
      }
    case getTypes.failure:
      return {
        ...state,
        pending: false,
        error: true,
      }
    case getTypes.success:
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
      }
    case changeTagsTypes.attempt:
      return {
        ...state,
        error: false,
        pending: false,
      }
    case changeTagsTypes.failure:
      return {
        ...state,
        pending: false,
        error: true,
      }
    case changeTagsTypes.success:
      return {
        ...state,
        pending: false,
        error: false,
        data: state.data.map(group =>
          group.id === action.response.studyGuidanceGroupId
            ? {
                ...state.data.find(group => group.id === action.response.studyGuidanceGroupId),
                tags: (({ studyGuidanceGroupId, ...rest }) => rest)(action.response), // omit id
              }
            : group
        ),
      }
    default:
      return state
  }
}

export default reducer
