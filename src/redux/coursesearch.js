import itemreducer, { actions } from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_COURSE_SEARCH_RESULT_'

const storeActions = actions(prefix)

export const clearCourses = storeActions.clear

export const findCourses = ({ name, type, discipline }, language = 'fi') => {
  const route = '/coursesmulti'
  const params = { name, type, discipline, language }
  return callController(route, prefix, [], 'get', params, params)
}

export const findCoursesV2 = ({ name, code }) => {
  const route = '/v2/coursesmulti'
  const params = { name, code }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix)

export default reducer
