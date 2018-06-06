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

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_POPULATION_FILTER':
      return state.concat(action.filter)
    case 'REMOVE_POPULATION_FILTER':
      return state.filter(f => f.id !== action.id)
    case 'REMOVE_POPULATION_FILTER_OF_COURSE': {
      const notRemoved = (filter) => {
        if (filter.type !== 'CourseParticipation') {
          return true
        }
        const { course } = filter.params[0]
        return course.name !== action.course.name || course.code !== action.course.code
      }

      return state.filter(notRemoved)
    }

    case 'CLEAR_POPULATION_FILTERS':
      return []
    case 'ALTER_POPULATION_COURSE_FILTER': {
      const toAlter = state.find(f => f.id === action.id)
      const course = toAlter.params[0]
      const alteredFilter = courseParticipation(course, action.field)
      alteredFilter.id = toAlter.id
      return state.map(f => (f.id !== action.id ? f : alteredFilter))
    }

    default:
      return state
  }
}

export default reducer
