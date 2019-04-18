import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_POPULATION_SEARCH_'

export const getPopulations = () => {
  const route = '/oodilearn/populations'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
