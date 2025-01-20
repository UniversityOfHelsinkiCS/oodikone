import { callController } from '@/apiConnection/index'
import { actions, listreducer } from './common/listreducer'

const prefix = 'COURSESTATS_'

const { reset } = actions(prefix)

export const clearCourseStats = reset

export const getCourseStats = (
  {
    courseCodes,
    separate = false,
    combineSubstitutions = true,
  }: { courseCodes: string[]; separate?: boolean; combineSubstitutions?: boolean },
  onProgress: any
) => {
  const route = '/v3/courseyearlystats'
  const params = {
    codes: courseCodes,
    separate,
    combineSubstitutions,
  }
  return callController(route, prefix, [], 'get', params, params, onProgress)
}

const responseToObj = courseStats => {
  const data = {}
  courseStats.forEach(stat => {
    data[stat.unifyStats.coursecode] = stat
  })
  return data
}

export const reducer = listreducer(prefix, responseToObj)
