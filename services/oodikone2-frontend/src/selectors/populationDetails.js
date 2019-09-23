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

    if (samples.length > 0 && populationFilters.filters.length > 0) {
      const studentsForFilter = f => {
        if (f.type === 'CourseParticipation') {
          return Object.keys(f.studentsOfSelectedField)
        }
        return samples.filter(f.filter).map(s => s.studentNumber)
      }

      const matchingStudents = populationFilters.filters.map(studentsForFilter)
      selectedStudents = intersection(...matchingStudents)

      if (complemented) {
        selectedStudents = difference(samples.map(s => s.studentNumber), selectedStudents)
      }
    }

    return { samples, selectedStudents, complemented, programme }
  }
)

export default {
  makePopulationsToData
}
