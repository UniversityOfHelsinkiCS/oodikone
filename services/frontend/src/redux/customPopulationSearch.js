import { callController } from '../apiConnection'

const initialState = {
  customPopulationSearches: [],
  latestCreatedCustomPopulationSearchId: null,
  saving: false,
  searchedCustomPopulationSearchId: null,
}

export const getCustomPopulationSearches = () => {
  const route = '/custom-population-search'
  const prefix = 'GET_CUSTOM_POPULATION_SEARCHES_'
  return callController(route, prefix)
}

export const saveCustomPopulationSearch = ({ name, studentnumberlist }) => {
  const route = '/custom-population-search'
  const prefix = 'SAVE_CUSTOM_POPULATION_SEARCH_'
  const body = { name, students: studentnumberlist }
  return callController(route, prefix, body, 'post')
}

export const updateCustomPopulationSearch = ({ id, studentnumberlist }) => {
  const route = `/custom-population-search/${id}`
  const prefix = 'UPDATE_CUSTOM_POPULATION_SEARCH_'
  const body = { students: studentnumberlist }
  return callController(route, prefix, body, 'put')
}

export const deleteCustomPopulationSearch = ({ id }) => {
  const route = `/custom-population-search/${id}`
  const prefix = 'DELETE_CUSTOM_POPULATION_SEARCH_'
  return callController(route, prefix, {}, 'delete')
}

export const selectCustomPopulationSearch = id => ({
  type: 'SELECT_CUSTOM_POPULATION_SEARCH',
  id,
})

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_CUSTOM_POPULATION_SEARCHES_SUCCESS':
      return {
        ...state,
        customPopulationSearches: action.response,
      }
    case 'UPDATE_CUSTOM_POPULATION_SEARCH_ATTEMPT':
    case 'SAVE_CUSTOM_POPULATION_SEARCH_ATTEMPT':
      return {
        ...state,
        saving: true,
      }
    case 'UPDATE_CUSTOM_POPULATION_SEARCH_FAILURE':
    case 'SAVE_CUSTOM_POPULATION_SEARCH_FAILURE':
      return {
        ...state,
        saving: false,
      }
    case 'SAVE_CUSTOM_POPULATION_SEARCH_SUCCESS':
      return {
        ...state,
        customPopulationSearches: state.customPopulationSearches.concat(action.response),
        latestCreatedCustomPopulationSearchId: action.response.id,
        saving: false,
      }
    case 'UPDATE_CUSTOM_POPULATION_SEARCH_SUCCESS':
      return {
        ...state,
        customPopulationSearches: state.customPopulationSearches.map(s =>
          s.id === action.response.id ? action.response : s
        ),
        saving: false,
      }
    case 'SELECT_CUSTOM_POPULATION_SEARCH':
      return {
        ...state,
        searchedCustomPopulationSearchId: action.id,
      }
    case 'DELETE_CUSTOM_POPULATION_SEARCH_ATTEMPT':
      return {
        ...state,
        deleting: true,
        deleted: null,
      }
    case 'DELETE_CUSTOM_POPULATION_SEARCH_FAILED':
      return {
        ...state,
        deleting: false,
      }
    case 'DELETE_CUSTOM_POPULATION_SEARCH_SUCCESS':
      return {
        ...state,
        deleting: false,
        customPopulationSearches: state.customPopulationSearches.filter(s => s.id !== action.response),
      }
    default:
      return state
  }
}

export default reducer
