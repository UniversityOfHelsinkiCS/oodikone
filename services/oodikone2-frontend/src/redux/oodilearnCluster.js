import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_GET_CLUSTER_'

export const getOodiLearnCluster = (code) => {
  const route = `/oodilearn/${code}`
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
