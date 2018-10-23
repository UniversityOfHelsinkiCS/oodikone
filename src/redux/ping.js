import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'PING_BACKEND_'

export const pingOodiBackend = () => callController('/ping', 'PING_BACKEND_')

const reducer = itemreducer(prefix, { data: 'No response data.' })

export default reducer
