import { createSelector } from 'reselect'

const DIMENSIONS_MAIN = ['Organised', 'Surface', 'Deep', 'SE', 'SBI']
const DIMENSIONS_ALL = [...DIMENSIONS_MAIN, 'IntRel', 'Peer', 'Align', 'ConsFeed']

const formatValue = value => parseFloat(value.toFixed(2))

const populationsSelector = state => state.oodilearnPopulations

const populationSelector = state => state.oodilearnPopulation.data

const populationFilterSelector = state => state.oodilearnPopulationForm

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
      average.data.push(formatValue(avg))
      below.data.push(formatValue(bel))
      above.data.push(formatValue(abv))
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
      averages.push(formatValue(average))
      ranges.push([formatValue(below), formatValue(above)])
    })
    return {
      dimensions,
      averages,
      ranges
    }
  }
)

const getFilteredPopulationStats = createSelector(
  [populationSelector, populationFilterSelector],
  (population, form) => {
    const filters = Object.entries(form).filter(entry => !!entry[1])
    const filtered = population.students.filter(student => filters.every(([category, value]) => {
      const { group } = student[category]
      return group === value
    }))
    const credits = filtered.reduce((all, student) => all.concat(student.credits), [])
    const stats = credits.reduce((acc, credit) => {
      const { grade, credits: op } = credit
      const gradeCount = acc.grades[grade] || 0
      return {
        total: acc.total + op,
        grades: {
          ...acc.grades,
          [grade]: gradeCount + 1
        }
      }
    }, {
      total: 0,
      grades: {}
    })
    const size = filtered.length
    return {
      grades: stats.grades,
      credits: {
        total: stats.total,
        average: formatValue(stats.total / size)
      },
      students: size
    }
  }
)

export default {
  getPopulations,
  getPopulation,
  getPopulationCategorySeries,
  populationIsLoading,
  getPopulationGraphSeries,
  getFilteredPopulationStats
}
