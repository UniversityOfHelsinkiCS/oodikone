import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'STUDYPROGRAMME_THROUGHPUT_'

export const getThroughput = (studyprogrammeId) => {
  const route = `v2//studyprogrammes/${studyprogrammeId}/throughput`
  return callController(route, prefix, [], 'get')
}

export const clearThroughput = () => ({
  type: `${prefix}_CLEAR`
})


const reducer = itemreducer(prefix, { data: [] })

export default reducer
