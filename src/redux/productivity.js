import { callController } from '../apiConnection/index'
import listreducer from './common/listreducer'

const prefix = 'STUDYPROGRAMME_PRODUCTIVITY_'

export const getProductivity = (studyprogrammeId) => {
  const route = `v2/studyprogrammes/${studyprogrammeId}/productivity`
  return callController(route, prefix, [], 'get')
}

const reducer = listreducer(prefix, null, false)

export default reducer
