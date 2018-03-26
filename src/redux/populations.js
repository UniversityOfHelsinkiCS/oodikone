import { callController } from '../apiConnection'

const getArrayParams = (paramName, entries) => entries.map(entry => `&${paramName}=${entry}`).join('')

export const getPopulationStatistics = ({
  year, semester, studyRights, uuid
}) => {
  const route = `/populationstatistics/?year=${year}&semester=${semester}${getArrayParams('studyRights', studyRights)}`
  const prefix = 'GET_POPULATION_STATISTICS_'
  const query = {
    year, semester, studyRights, uuid
  }
  return callController(route, prefix, null, 'get', query)
}

export const clearPopulations = () => ({
  type: 'CLEAR_POPULATIONS'
})

export const removePopulation = uuid => ({
  type: 'REMOVE_POPULATION',
  uuid
})

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'GET_POPULATION_STATISTICS_ATTEMPT':
      return [...state, {
        pending: true,
        error: false,
        data: [],
        query: action.requestSettings.query
      }]
    case 'GET_POPULATION_STATISTICS_FAILURE':
      return [...state.filter(apiCall => !apiCall.pending), {
        pending: false,
        error: true,
        data: action.response,
        query: action.query
      }]
    case 'GET_POPULATION_STATISTICS_SUCCESS':
      return [...state.filter(apiCall => !apiCall.pending), {
        pending: false,
        error: false,
        data: action.response,
        query: action.query
      }]
    case 'REMOVE_POPULATION':
      return [...state.filter(apiCall => apiCall.query.uuid !== action.uuid)]
    case 'CLEAR_POPULATIONS':
      return []
    default:
      return state
  }
}

export default reducer
