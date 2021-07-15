import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_TOP_TEACHERS_CATEGORIES_'

export const getTopTeachersCategories = () => {
  const route = '/teachers/top/categories'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
