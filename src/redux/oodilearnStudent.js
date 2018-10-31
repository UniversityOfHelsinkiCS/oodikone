import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_STUDENT_SEARCH_'

export const getStudentData = (id) => {
  const route = `/oodilearn/student/${id}`
  return callController(route, prefix)
}

const reducer = itemreducer(prefix, { data: undefined })

export default reducer
