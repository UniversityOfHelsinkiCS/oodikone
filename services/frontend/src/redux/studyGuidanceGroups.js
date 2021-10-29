import { callController } from '../apiConnection'
import itemreducer from './common/itemreducer'

const getPrefix = 'GET_STUDY_GUIDANCE_GROUPS_'
const changeTagsPrefix = 'CHANGE_STUDY_GUIDANCE_GROUP_TAGS_'

export const getStudyGuidanceGroups = () => {
  const route = '/studyguidancegroups'
  return callController(route, getPrefix)
}

export const changeStudyGuidanceGroupTags = (groupId, tags) => {
  const route = `/studyguidancegroups/${groupId}/tags`
  return callController(route, changeTagsPrefix, tags, 'put')
}

const getReducer = itemreducer(getPrefix)
const changeTagsReducer = itemreducer(changeTagsPrefix)

export default { getReducer, changeTagsReducer }
