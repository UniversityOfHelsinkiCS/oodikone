import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'PING_OODILEARN_'

export const pingOodiLearn = () => callController('/oodilearn/ping', prefix)

const reducer = itemreducer(prefix, { data: 'No response data.' })

export default reducer
