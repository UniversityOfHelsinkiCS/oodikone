import { callController } from '../apiConnection/index'
import listreducer from './common/listreducer'

const prefix = 'GET_STUDYPROGRAMME_PRESENT_STUDENTS_'

export const getPresentStudents = studyprogrammeId => {
  const route = `v2/studyprogrammes/${studyprogrammeId}/present_students`
  return callController(route, prefix, [], 'get')
}

export const clearPresentStudents = () => ({
  type: `${prefix}_CLEAR`
})

const reducer = listreducer(prefix, null, false)

export default reducer
