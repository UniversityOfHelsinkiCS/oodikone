import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'OODILEARN_GET_POPULATION_'

export const getOodilearnPopulation = (id) => {
  const route = `/oodilearn/populations/${id}`
  return callController(route, prefix)
}

const reducer = itemreducer(prefix, { data: undefined })

export default reducer
