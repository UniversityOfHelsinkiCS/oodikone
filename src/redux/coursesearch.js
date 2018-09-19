import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_COURSE_SEARCH_RESULT_'

export const findCourses = ({ name, type, discipline }, language = 'fi') => {
  const route = '/coursesmulti'
  const params = { name, type, discipline, language }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix)

export default reducer
