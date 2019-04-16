import { callController } from '../apiConnection/index'
import listreducer from './common/listreducer'

const prefix = 'GET_STUDYPROGRAMME_THROUGHPUT_'

export const getThroughput = (studyprogrammeId) => {
  const route = `v2/studyprogrammes/${studyprogrammeId}/throughput`
  return callController(route, prefix, [], 'get')
}

const reducer = listreducer(prefix, null, false)

export default reducer
