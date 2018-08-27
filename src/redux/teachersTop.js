import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_TOP_TEACHERS_'

export const getTopTeachers = () => {
  const route = '/teachers/top'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
