import { ALL } from '@/selectors/courseStats'
import { formreducer } from './common/formreducer'

const prefix = 'COURSE_SUMMARY_FORM'

const reducer = formreducer(prefix, { programmes: [ALL.value] })

export const { reducer: coursesSummaryFormReducer, setValue } = reducer
