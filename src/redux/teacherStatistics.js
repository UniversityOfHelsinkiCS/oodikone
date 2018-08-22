import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_TEACHER_STATISTICS_'

export const getTeacherStatistics = (year, providers) => {
  const route = '/teachers/stats'
  const params = {
    providers,
    startYearCode: year
  }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix)

export default reducer
