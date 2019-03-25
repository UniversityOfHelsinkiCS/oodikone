import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_SEMESTERS_'

export const getSemesters = () => callController('/semesters/codes', prefix)

const reducer = itemreducer(prefix, { data: {} })

export default reducer
