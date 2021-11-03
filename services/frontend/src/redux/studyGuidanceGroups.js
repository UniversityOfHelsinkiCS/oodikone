import { createReducer } from '@reduxjs/toolkit'
import { callController, actionTypes } from '../apiConnection'
import { initialState, matcherReducers, defaultReducer } from './common'

const baseUrl = '/studyguidancegroups'
const getPrefix = 'GET_STUDY_GUIDANCE_GROUPS_'
const getTypes = {
  ...actionTypes(getPrefix),
}
const changeTagsPrefix = 'CHANGE_STUDY_GUIDANCE_GROUP_TAGS_'
const changeTagsTypes = {
  ...actionTypes(changeTagsPrefix),
}

export const getStudyGuidanceGroups = () => callController(baseUrl, getPrefix)

export const changeStudyGuidanceGroupTags = (groupId, tags) =>
  callController(`${baseUrl}/${groupId}/tags`, changeTagsPrefix, tags, 'put')

const reducer = createReducer(
  initialState,
  {
    [getTypes.success]: (state, action) => {
      state.data = action.response
    },
    [changeTagsTypes.success]: (state, action) => {
      state.data.find(group => group.id === action.response.studyGuidanceGroupId).tags = (({
        studyGuidanceGroupId,
        ...rest
      }) => rest)(action.response)
    },
  },
  matcherReducers,
  defaultReducer
)

export default reducer
