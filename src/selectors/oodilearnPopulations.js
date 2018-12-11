import { createSelector } from 'reselect'

const DIMENSIONS_MAIN = ['SBI', 'SE', 'Deep', 'Surface', 'Organised']
const DIMENSIONS_ALL = [...DIMENSIONS_MAIN, 'IntRel', 'Peer', 'Align', 'ConsFeed']

const formatValue = value => parseFloat(value.toFixed(2))

const populationsSelector = state => state.oodilearnPopulations

const populationSelector = state => state.oodilearnPopulation.data

const populationFilterSelector = state => state.oodilearnPopulationForm

const selectedCourseSelector = state => state.oodilearnPopulationCourseSelect.course

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
  [populationSelector, populationFilterSelector, selectedCourseSelector],
  (population, form, course) => {
    const filters = Object.entries(form).filter(entry => !!entry[1])
    const filtered = population.students.filter((student) => {
      const matchesFilter = filters.every(([category, value]) => {
        const { group } = student[category]
        return group === value
      })
      const hasCourse = !course ? true : student.credits.some(credit => credit.course.code === course)
      return matchesFilter && hasCourse
    })
    const credits = filtered.reduce((all, student) => {
      const studentCredits = !course ? student.credits : student.credits.filter(cr => cr.course.code === course)
      return all.concat(studentCredits)
    }, [])
    const stats = credits
      .reduce((acc, credit) => {
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

const getPopulationStackedSeries = createSelector(
  [populationSelector, populationFilterSelector],
  (population, filters) => {
    const categories = [...DIMENSIONS_ALL]
    const series = {
      below: [],
      average: [],
      above: []
    }
    categories.forEach((category) => {
      const { below: b, above: a } = population.categories[category]
      const below = formatValue(b)
      const above = formatValue(a)
      const selected = filters[category]
      series.below.push(!selected || selected === 'below' ? [0, below] : [])
      series.average.push(!selected || selected === 'average' ? [below, above] : [])
      series.above.push(!selected || selected === 'above' ? [above, 5] : [])
    })
    return {
      categories,
      series
    }
  }
)

const getPopulationCourses = createSelector(
  populationSelector,
  population => population.courses.map(({ text, value }) => ({ text, value, description: value }))
)

export default {
  getPopulations,
  getPopulation,
  getPopulationCategorySeries,
  populationIsLoading,
  getPopulationGraphSeries,
  getFilteredPopulationStats,
  getPopulationStackedSeries,
  getPopulationCourses,
  selectedCourseSelector
}
