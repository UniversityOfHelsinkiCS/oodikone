import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_STUDYRIGHT_ELEMENTS_'

export const getStudyrightElements = () => {
  const route = '/v2/studyprogrammes'
  return callController(route, prefix)
}

const reducer = itemreducer(prefix, { data: {} })

export default reducer
