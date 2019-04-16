import { createSelector } from 'reselect'
import { reformatDate } from '../common'

const getStudents = students => students.data

export const formatStudents = students =>
  students.map(({ studentNumber, credits, started, lastname, firstnames }) => {
    const date = reformatDate(started, 'DD.MM.YYYY')
    return { studentNumber, started: date, credits, lastname, firstnames }
  })

export const makeFormatStudentRows = () => createSelector(
  getStudents,
  formatStudents
)
