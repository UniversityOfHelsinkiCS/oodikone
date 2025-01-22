import { callController } from '@/apiConnection/index'
import { CourseStat } from '@/types/courseStat'
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

const responseToObj = (courseStats: Record<string, CourseStat>[]) => {
  const data: Record<string, Record<string, CourseStat>> = {}
  courseStats.forEach(stat => {
    data[stat.unifyStats.coursecode] = stat
  })
  return data
}

export const reducer = listreducer(prefix, responseToObj)
