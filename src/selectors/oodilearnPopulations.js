import { createSelector } from 'reselect'

const DIMENSIONS_MAIN = ['Organised', 'Surface', 'Deep', 'SE', 'SBI']
const DIMENSIONS_ALL = [...DIMENSIONS_MAIN, 'IntRel', 'Peer', 'Align', 'ConsFeed']

const populationsSelector = state => state.oodilearnPopulations

const populationSelector = state => state.oodilearnPopulation.data

const getPopulations = createSelector(
  populationsSelector,
  ({ data = [] }) => data.map((({ population: id }) => ({ id })))
)

const getPopulation = createSelector(
  populationSelector,
  population => population
)

const getPopulationCategorySeries = createSelector(
  populationSelector,
  (population) => {
    if (!population) {
      return undefined
    }
    const { categories } = population
    const dimensions = DIMENSIONS_MAIN
    const average = { name: 'Average', data: [] }
    const below = { name: 'Below', data: [] }
    const above = { name: 'Above', data: [] }
    dimensions.forEach((dimension) => {
      const { average: avg, below: bel, above: abv } = categories[dimension]
      average.data.push(avg)
      below.data.push(bel)
      above.data.push(abv)
    })
    return {
      categories: { below, average, above },
      dimensions
    }
  }
)

const populationIsLoading = (state) => {
  const { oodilearnPopulation: population } = state
  return population.pending || !population.data
}

const getPopulationGraphSeries = createSelector(
  populationSelector,
  (population) => {
    if (!population) {
      return undefined
    }
    const { categories } = population
    const dimensions = DIMENSIONS_ALL
    const averages = []
    const ranges = []
    dimensions.forEach((dimension) => {
      const { below, average, above } = categories[dimension]
      averages.push(average)
      ranges.push([below, above])
    })
    return {
      dimensions,
      averages,
      ranges
    }
  }
)

export default {
  getPopulations,
  getPopulation,
  getPopulationCategorySeries,
  populationIsLoading,
  getPopulationGraphSeries
}
