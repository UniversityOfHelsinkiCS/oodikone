import { courseParticipation } from '../populationFilters'

export const clearPopulationFilters = () => ({
  type: 'CLEAR_POPULATION_FILTERS'
})

export const setPopulationFilter = filter => ({
  type: 'ADD_POPULATION_FILTER',
  filter
})

export const alterPopulationCourseFilter = (id, field) => ({
  type: 'ALTER_POPULATION_COURSE_FILTER',
  id,
  field
})

export const removePopulationFilter = id => ({
  type: 'REMOVE_POPULATION_FILTER',
  id
})

export const removePopulationFilterOfCourse = course => ({
  type: 'REMOVE_POPULATION_FILTER_OF_COURSE',
  course
})
export const setComplementFilter = () => ({
  type: 'SET_COMPLEMENT_FILTER'
})


const initial = {
  filters: [],
  complemented: true
}
initial.complemented = false

const reducer = (state = initial, action) => {
  switch (action.type) {
    case 'ADD_POPULATION_FILTER':
      state.filters = state.filters.concat(action.filter)
      return state
    case 'REMOVE_POPULATION_FILTER':
      state.filters = state.filters.filter(f => f.id !== action.id)
      return state
    case 'REMOVE_POPULATION_FILTER_OF_COURSE': {
      const notRemoved = (filter) => {
        if (filter.type !== 'CourseParticipation') {
          return true
        }
        const { course } = filter.params[0]
        return course.name !== action.course.name || course.code !== action.course.code
      }
      state.filters = state.filters.filter(notRemoved)
      return state
    }

    case 'CLEAR_POPULATION_FILTERS':
      state.filters = []
      return state
    case 'ALTER_POPULATION_COURSE_FILTER': {
      const toAlter = state.filters.find(f => f.id === action.id)
      const course = toAlter.params[0]
      const alteredFilter = courseParticipation(course, action.field)
      alteredFilter.id = toAlter.id
      state.filters = state.filters.map(f => (f.id !== action.id ? f : alteredFilter))
      return state
    }
    case 'SET_COMPLEMENT_FILTER': {
      state.complemented = !state.complemented
      return state
    }

    default:
      return state
  }
}

export default reducer
