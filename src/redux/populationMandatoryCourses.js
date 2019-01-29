import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_MANDATORY_COURSES_'

export const getMandatoryCourses = (id) => {
  const route = `/v2/studyprogrammes/${id}/mandatory_courses`
  return callController(route, prefix)
}
const reducer = itemreducer(prefix, { data: [] })

export default reducer
