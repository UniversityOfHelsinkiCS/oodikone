import { createSelector } from 'reselect'
import { removeInvalidCreditsFromStudents } from '../common'

const getPopulations = state => state.populations

export const flattenAndCleanPopulations = (populations) => {
  const { pending, data } = populations
  return pending || !data.students ? [] : removeInvalidCreditsFromStudents(data.students)
}

export const makePopulationsToData = () => createSelector(
  getPopulations,
  flattenAndCleanPopulations
)
