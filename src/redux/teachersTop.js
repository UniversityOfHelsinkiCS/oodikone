import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_TOP_TEACHERS_'

export const getTopTeachers = (yearcode) => {
  const route = '/teachers/top'
  const params = { yearcode }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix)

export default reducer
