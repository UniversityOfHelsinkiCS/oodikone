import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'GET_ACCESS_GROUPS_'

export const getAccessGroups = () => callController('/users/access_groups', prefix)

const reducer = itemreducer(prefix)

export default reducer
