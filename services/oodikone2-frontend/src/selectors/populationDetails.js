import { createSelector } from 'reselect'

const getPopulations = state => state.populations

export const flattenAndCleanPopulations = (populations) => {
  const { pending, data } = populations
  return pending || !data.students ? [] : data.students
}

export const makePopulationsToData = () => createSelector(
  getPopulations,
  flattenAndCleanPopulations
)
