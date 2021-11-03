import { createReducer } from '@reduxjs/toolkit'
import { callController, actionTypes } from '../apiConnection'

const baseUrl = '/studyguidancegroups'

const getPrefix = 'GET_STUDY_GUIDANCE_GROUPS_'
const getTypes = {
  ...actionTypes(getPrefix),
}
const changeTagsPrefix = 'CHANGE_STUDY_GUIDANCE_GROUP_TAGS_'
const changeTagsTypes = {
  ...actionTypes(changeTagsPrefix),
}
const initialState = {
  pending: false,
  error: false,
  data: [],
}

export const getStudyGuidanceGroups = () => callController(baseUrl, getPrefix)

export const changeStudyGuidanceGroupTags = (groupId, tags) =>
  callController(`${baseUrl}/${groupId}/tags`, changeTagsPrefix, tags, 'put')

const reducer = createReducer(
  initialState,
  {
    [getTypes.attempt]: state => {
      state.error = false
      state.pending = true
    },
    [getTypes.failure]: state => {
      state.error = true
      state.pending = false
    },
    [getTypes.success]: (state, action) => {
      state.error = false
      state.pending = false
      state.data = action.response
    },
    [changeTagsTypes.attempt]: state => {
      state.error = false
      state.pending = true
    },
    [changeTagsTypes.failure]: state => {
      state.error = true
      state.pending = false
    },
    [changeTagsTypes.success]: (state, action) => {
      state.error = false
      state.pending = false
      state.data.find(group => group.id === action.response.studyGuidanceGroupId).tags = (({
        studyGuidanceGroupId,
        ...rest
      }) => rest)(action.response)
    },
  },
  [],
  () => {}
)

export default reducer
