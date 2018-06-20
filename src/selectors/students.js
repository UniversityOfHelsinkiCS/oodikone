import { createSelector } from 'reselect'

const getStudents = students => students.data

export const formatStudents = students =>
  students.map(({ studentNumber, credits, lastname, firstnames }) => (
    { studentNumber, credits, lastname, firstnames }
  ))

export const makeFormatStudentRows = () => createSelector(
  getStudents,
  formatStudents
)
