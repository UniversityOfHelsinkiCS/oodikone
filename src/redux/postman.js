import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'POSTMAN_GETTER_'

export const doGet = (route, params) => {
  if (!params) {
      return callController(route, prefix)
  }
  return callController(route, prefix, [], 'get', params, params)
}

const reducer = itemreducer(prefix)

export default reducer
