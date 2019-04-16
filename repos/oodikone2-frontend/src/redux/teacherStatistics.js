import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_TEACHER_STATISTICS_'

export const getTeacherStatistics = (semesterStart, semesterEnd, providers) => {
  const route = '/teachers/stats'
  const params = {
    providers,
    semesterStart,
    semesterEnd
  }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix)

export default reducer
