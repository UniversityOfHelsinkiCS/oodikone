import { callController } from '@/apiConnection/index'
import { listreducer, actions } from './common/listreducer'

const prefix = 'COURSESTATS_'

const { reset } = actions(prefix)

export const clearCourseStats = reset

export const getCourseStats = ({ courseCodes, separate, combineSubstitutions = true }, onProgress) => {
  const route = '/v3/courseyearlystats'
  const params = {
    codes: courseCodes,
    separate,
    combineSubstitutions,
  }
  return callController(route, prefix, [], 'get', params, params, onProgress)
}

const responseToObj = coursestats => {
  const data = {}
  coursestats.forEach(stat => {
    data[stat.unifyStats.coursecode] = stat
  })
  return data
}

export const reducer = listreducer(prefix, responseToObj)
