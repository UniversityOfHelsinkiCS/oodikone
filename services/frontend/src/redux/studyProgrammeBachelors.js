import { callController } from '../apiConnection/index'
import listreducer from './common/listreducer'

const prefix = 'GET_STUDYPROGRAMME_BACHELORS_'

export const getBachelors = studyprogrammeId => {
  const route = `v2/studyprogrammes/${studyprogrammeId}/optiondata`
  return callController(route, prefix, [], 'get')
}

const reducer = listreducer(prefix, null, true)

export default reducer
