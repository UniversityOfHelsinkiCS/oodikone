import { courseParticipation } from '../populationFilters'
import { callController } from '../apiConnection'

const getArrayParams = (paramName, entries) => entries.map(entry => `&${paramName}=${entry}`).join('')

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

export const savePopulationFilters = (preset) => {
  const route = '/v2/populationstatistics/filters'
  const prefix = 'SAVE_FILTER_'
  const data = preset
  console.log(preset)
  const method = 'post'
  return callController(route, prefix, data, method)
}

export const getPopulationFilters = ({ studyRights }) => {
  const route = `/v2/populationstatistics/filters?${getArrayParams('studyRights', studyRights)}`
  const prefix = 'GET_FILTER_'
  const query = {
    studyRights
  }
  return callController(route, prefix, null, 'get', query)
}
const initial = {
  filters: [],
  filtersFromBackend: [],
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
        const { course } = filter.params.course
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
      const { course } = toAlter.params
      const alteredFilter = courseParticipation(course, action.field)
      alteredFilter.id = toAlter.id
      state.filters = state.filters.map(f => (f.id !== action.id ? f : alteredFilter))
      return state
    }
    case 'SET_COMPLEMENT_FILTER': {
      state.complemented = !state.complemented
      return state
    }
    case 'SAVE_FILTER_ATTEMPT':
      return {
        pending: true,
        error: false,
        ...state
      }
    case 'SAVE_FILTER_FAILURE':
      return {
        pending: false,
        error: true,
        ...state
      }
    case 'SAVE_FILTER_SUCCESS':
      return {
        pending: false,
        error: false,
        ...state
      }
    case 'GET_FILTER_ATTEMPT':
      return {
        pending: true,
        error: false,
        ...state
      }
    case 'GET_FILTER_FAILURE':
      return {
        pending: false,
        error: true,
        ...state
      }
    case 'GET_FILTER_SUCCESS':
      state.filtersFromBackend = state.filtersFromBackend.concat(action.response)
      return {
        pending: false,
        error: false,
        ...state
      }

    default:
      return state
  }
}

export default reducer
