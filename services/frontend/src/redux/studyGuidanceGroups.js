import { callController } from '../apiConnection'
import itemreducer from './common/itemreducer'

const prefix = 'GET_STUDY_GUIDANCE_GROUPS_'

export const getStudyGuidanceGroups = () => {
  const route = '/studyguidancegroups'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
