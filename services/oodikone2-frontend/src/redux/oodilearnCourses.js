import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_COURSE_SEARCH_'

export const getCourses = () => {
  const route = '/oodilearn/courses'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
