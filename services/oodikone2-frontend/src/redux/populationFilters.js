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

export const refreshFilters = () => ({
  type: 'REFRESH_FILTERS'
})

export const savePopulationFilters = (preset) => {
  const route = '/v2/populationstatistics/filters'
  const prefix = 'SAVE_FILTER_'
  const data = preset
  const method = 'post'
  return callController(route, prefix, data, method)
}
export const deletePopulationFilter = (preset) => {
  const route = '/v2/populationstatistics/filters'
  const prefix = 'DELETE_FILTER_'
  const data = preset
  const method = 'delete'
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
  complemented: true,
  refreshNeeded: false // used to keep track whether the course table is refreshed or not
}
initial.complemented = false

const reducer = (state = initial, action) => {
  switch (action.type) {
    case 'ADD_POPULATION_FILTER':
      return {
        ...state,
        filters: state.filters.concat(action.filter),
        refreshNeeded: true
      }
    case 'REMOVE_POPULATION_FILTER':
      return {
        ...state,
        filters: state.filters.filter(f => f.id !== action.id),
        refreshNeeded: true
      }
    case 'REMOVE_POPULATION_FILTER_OF_COURSE': {
      const notRemoved = (filter) => {
        if (filter.type !== 'CourseParticipation') {
          return true
        }
        const { course } = filter.params.course

        return (course.name.fi !== action.course.name.fi &&
          course.name.en !== action.course.name.en &&
          course.name.sv !== action.course.name.sv) ||
          course.code !== action.course.code
      }
      return {
        ...state,
        filters: state.filters.filter(notRemoved),
        refreshNeeded: true
      }
    }

    case 'CLEAR_POPULATION_FILTERS':
      return {
        ...state,
        filters: [],
        refreshNeeded: true
      }
    case 'ALTER_POPULATION_COURSE_FILTER': {
      const toAlter = state.filters.find(f => f.id === action.id)
      const { course } = toAlter.params
      const params = { course, field: action.field }
      const alteredFilter = courseParticipation(params)
      alteredFilter.id = toAlter.id
      return {
        ...state,
        filters: state.filters.map(f => (f.id !== action.id ? f : alteredFilter)),
        refreshNeeded: true
      }
    }
    case 'SET_COMPLEMENT_FILTER': {
      return {
        ...state,
        complemented: !state.complemented,
        refreshNeeded: true
      }
    }
    case 'SAVE_FILTER_ATTEMPT':
      return {
        ...state,
        filterPending: true,
        error: false
      }
    case 'SAVE_FILTER_FAILURE':
      return {
        ...state,
        filterPending: false,
        error: true
      }
    case 'SAVE_FILTER_SUCCESS':
      return {
        ...state,
        filterPending: false,
        error: false,
        filtersFromBackend: state.filtersFromBackend.concat(action.response)
      }
    case 'GET_FILTER_ATTEMPT':
      return {
        ...state,
        filterPending: true,
        error: false
      }
    case 'GET_FILTER_FAILURE':
      return {
        ...state,
        filterPending: false,
        error: true
      }
    case 'GET_FILTER_SUCCESS':
      return {
        ...state,
        filterPending: false,
        error: false,
        filtersFromBackend: action.response
      }
    case 'DELETE_FILTER_ATTEMPT':
      return {
        ...state,
        filterPending: true,
        error: false
      }
    case 'DELETE_FILTER_FAILURE':
      return {
        ...state,
        filterPending: false,
        error: true
      }
    case 'DELETE_FILTER_SUCCESS':
      return {
        ...state,
        filterPending: false,
        error: false,
        filtersFromBackend: state.filtersFromBackend.filter(f => f.id !== action.response.id)
      }
    case 'REFRESH_FILTERS':
      return {
        ...state,
        courseTableFilters: state.filters.map(fil => fil.id),
        refreshNeeded: false
      }
    default:
      return state
  }
}

export default reducer
