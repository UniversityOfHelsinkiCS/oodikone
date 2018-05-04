import { createSelector } from 'reselect'
import { reformatDate } from '../common'

const getStudents = students => students.data

export const formatStudents = students => students.map(({ studentNumber, started, credits }) => {
  const date = reformatDate(started, 'DD.MM.YYYY')
  return { studentNumber, started: date, credits }
})

export const makeFormatStudentRows = () => createSelector(
  getStudents,
  formatStudents
)

