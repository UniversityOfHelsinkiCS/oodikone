import { createSelector } from 'reselect'

const getStudents = students => students.data

export const formatStudents = students => students.map(({ studentNumber, started, credits }) =>
  ({ studentNumber, started, credits }))

export const makeFormatStudentRows = () => createSelector(
  getStudents,
  formatStudents
)

