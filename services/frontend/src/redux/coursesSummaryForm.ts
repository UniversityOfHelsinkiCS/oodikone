import { ALL } from '@/selectors/courseStats'
import { formreducer } from './common/formreducer'

const prefix = 'COURSE_SUMMARY_FORM'

const courseSummaryreducer = formreducer(prefix, { programmes: [ALL.value] })

export const { reducer, setValue } = courseSummaryreducer
