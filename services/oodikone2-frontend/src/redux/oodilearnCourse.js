import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_GET_COURSE_'

export const getOodiLearnCourse = (code) => {
  const route = `/oodilearn/courses/${code}`
  return callController(route, prefix)
}

const reducer = itemreducer(prefix, { data: undefined })

export default reducer
