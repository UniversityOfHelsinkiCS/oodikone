import { createSelector } from 'reselect'
import { intersection, difference } from 'lodash'

const getPopulations = state => state.populations

const getFilters = state => state.populationFilters

const makePopulationsToData = createSelector(
  [getPopulations, getFilters],
  (populations, populationFilters) => {
    const { pending, data, query } = populations
    const { programme } = query ? query.studyRights : ''

    const samples = pending || !data.students ? [] : data.students
    const { complemented } = populationFilters
    let selectedStudents = samples.length > 0 ? samples.map(({ studentNumber }) => studentNumber) : []
    const years = []
    const selectedStudentsByYear = {}

    if (samples.length > 0) {
      samples.forEach(student => {
        if (!selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()]) {
          selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()] = []
          years.push(new Date(student.studyrightStart).getFullYear())
        }
        selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
      })
    }

    if (samples.length > 0 && populationFilters.filters.length > 0) {
      const studentsForFilter = f => {
        return samples.filter(f.filter).map(s => s.studentNumber)
      }

      const matchingStudents = populationFilters.filters.map(studentsForFilter)
      selectedStudents = intersection(...matchingStudents)

      if (complemented) {
        selectedStudents = difference(samples.map(s => s.studentNumber), selectedStudents)
      }
      years.forEach(year => {
        selectedStudentsByYear[year] = intersection(...matchingStudents, selectedStudentsByYear[year])
      })
    }

    return { samples, selectedStudents, complemented, programme, selectedStudentsByYear }
  }
)

export default {
  makePopulationsToData
}
