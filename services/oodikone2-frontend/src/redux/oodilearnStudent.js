import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_STUDENT_SEARCH_'

export const getStudentData = (searchTerm) => {
  const route = '/oodilearn/student'
  const params = { searchTerm }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix, { data: undefined })

export default reducer
