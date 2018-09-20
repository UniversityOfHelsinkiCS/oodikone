import formreducer from './common/formreducer'
import selector from '../selectors/courseStats'

const { ALL } = selector

const prefix = 'COURSE_SUMMARY_FORM'

export const fields = {
  programme: 'programme'
}

const reducer = formreducer(prefix, { [fields.programme]: ALL.value })

export const { setValue, clear } = reducer

export default reducer.reducer
