import formreducer from './common/formreducer'

const prefix = 'OODILEARN_POPULATION_COURSE_SELECT'

export const fields = {
  COURSE: 'course'
}

const reducer = formreducer(prefix)

const { setValue, clear } = reducer

export const courseSelectActions = { setValue, clear }

export const setCourse = value => setValue(fields.COURSE, value)

export default reducer.reducer
