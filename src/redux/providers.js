import { callController } from '../apiConnection'
import itemreducer from './common/itemreducer'

const prefix = 'GET_PROVIDERS_'

export const getProviders = () => {
  const route = '/providers'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix)

export default reducer
