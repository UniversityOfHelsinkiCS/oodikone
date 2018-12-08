import { createSelector } from 'reselect'

const populationsSelector = state => state.oodilearnPopulations

const populationSelector = (state, id) => state.oodilearnPopulations.data.find(p => p.population === id)

const getPopulations = createSelector(
  populationsSelector,
  ({ data = [] }) => data.map((({ population: id }) => ({ id })))
)

const getPopulation = createSelector(
  populationSelector,
  population => population
)

export default {
  getPopulations,
  getPopulation
}
