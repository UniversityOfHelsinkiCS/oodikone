import listreducer, { actions } from './common/listreducer'
import { callController } from '../apiConnection/index'

const prefix = 'COURSESTATS_'

const { reset } = actions(prefix)

export const clearCourseStats = reset

export const getCourseStats = ({ fromYear, toYear, courseCodes, separate }, onProgress) => {
  const route = '/v3/courseyearlystats'
  const params = {
    codes: courseCodes,
    startyearcode: fromYear,
    endyearcode: toYear,
    separate
  }
  return callController(route, prefix, [], 'get', params, params, onProgress)
}

const responseToObj = (coursestats) => {
  const data = {}
  coursestats.forEach((stat) => {
    data[stat.coursecode] = stat
  })
  return data
}

const reducer = listreducer(prefix, responseToObj)

export default reducer
