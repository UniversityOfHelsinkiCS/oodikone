import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_COURSE_DISCIPLINES_'

export const getCourseDisciplines = () => callController('/courseDisciplines', prefix)

const reducer = itemreducer(prefix)

export default reducer
