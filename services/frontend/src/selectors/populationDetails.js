import { createSelector } from '@reduxjs/toolkit'

const getPopulations = state => state.populations

const makePopulationsToData = createSelector([getPopulations], populations => {
  const { pending, data, query } = populations
  const { programme } = query ? query.studyRights : ''

  const samples = pending || !data.students ? [] : data.students
  const complemented = false
  const selectedStudents = samples.length > 0 ? samples.map(({ studentNumber }) => studentNumber) : []
  const years = []
  const selectedStudentsByYear = {}
  const queryIsSet = !!query
  const isLoading = pending === true

  if (samples.length > 0) {
    samples.forEach(student => {
      if (!selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()]) {
        selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()] = []
        years.push(new Date(student.studyrightStart).getFullYear())
      }
      selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
    })
  }

  return { samples, selectedStudents, complemented, programme, selectedStudentsByYear, queryIsSet, isLoading, query }
})

export default {
  makePopulationsToData,
}
