import { createSelector } from 'reselect'
import { removeInvalidCreditsFromStudents } from '../common'

const getPopulations = state => state.populations

export const flattenAndCleanPopulations = populations =>
  populations.filter(population => !population.pending)
    .map(population => population.data)
    .map(student => removeInvalidCreditsFromStudents(student))

export const makePopulationsToData = () => createSelector(
  getPopulations,
  flattenAndCleanPopulations
)
