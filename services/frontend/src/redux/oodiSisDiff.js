import listreducer, { actions } from './common/listreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODI_SIS_DIFF_'

const { reset } = actions(prefix)

export const clearOodiSisDiff = reset

export const getCourseStatsDiff = ({ courseCodes, separate, unifyOpenUniCourses }, onProgress) => {
  const route = '/diff/courseyearlystats'
  const params = {
    codes: courseCodes,
    separate,
    unifyOpenUniCourses
  }
  return callController(route, prefix, [], 'get', params, params, onProgress)
}

const reducer = listreducer(prefix)

export default reducer
