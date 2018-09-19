import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_COURSE_TYPES_'

export const getCourseTypes = () => callController('/coursetypes', prefix)

const reducer = itemreducer(prefix)

export default reducer
