import formreducer from './common/formreducer'
import { ALL } from '../selectors/courseStats'

const prefix = 'COURSE_SUMMARY_FORM'

export const fields = {
  programmes: 'programmes'
}

const reducer = formreducer(prefix, { [fields.programmes]: [ALL.value] })

export const { setValue, clear } = reducer

export default reducer.reducer
