import { createSelector } from '@reduxjs/toolkit'

const getPopulations = state => state.populations

export const makePopulationsToData = createSelector([getPopulations], populations => {
  const { pending, data, query } = populations

  const samples = pending || !data.students ? [] : data.students
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

  return { samples, selectedStudentsByYear, queryIsSet, isLoading, query }
})
