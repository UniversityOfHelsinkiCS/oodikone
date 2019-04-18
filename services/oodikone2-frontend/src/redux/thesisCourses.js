import createReducer from './common/crudreducer'
import { callController } from '../apiConnection/index'

const prefix = 'PROGRAMME_THESIS_'

const options = {
  defaults: { data: [] },
  reduceDELETE: (data, action) => data.filter(c => c.courseCode !== action.query.course)
}

const { reducer, prefixGET, prefixPOST, prefixDELETE } = createReducer(prefix, options)

export const getThesisCourses = (studyprogramme) => {
  const route = `/v2/studyprogrammes/${studyprogramme}/thesis`
  return callController(route, prefixGET, [], 'get')
}

export const createNewThesisCourse = (studyprogramme, course, thesisType) => {
  const route = `/v2/studyprogrammes/${studyprogramme}/thesis`
  const data = { course, thesisType }
  return callController(route, prefixPOST, data, 'post')
}

export const deleteThesisCourse = (studyprogramme, course) => {
  const route = `/v2/studyprogrammes/${studyprogramme}/thesis/${course}`
  return callController(route, prefixDELETE, [], 'delete', { studyprogramme, course })
}

export default reducer
