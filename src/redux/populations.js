import { callController } from '../apiConnection'

const getArrayParams = (paramName, entries) => entries.map(entry => `&${paramName}=${entry}`).join('')

const initialState = {
  pending: false,
  error: false,
  data: [],
  query: undefined
}

export const getPopulationStatistics = ({
  year, semester, studyRights, months, uuid
}) => {
  const route = `/v2/populationstatistics/?year=${year}&semester=${semester}${getArrayParams('studyRights', studyRights)}&months=${months}`
  const prefix = 'GET_POPULATION_STATISTICS_'
  const query = {
    year, semester, studyRights, uuid, months
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

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_STATISTICS_ATTEMPT':
      return {
        pending: true,
        error: false,
        data: [],
        query: action.requestSettings.query
      }
    case 'GET_POPULATION_STATISTICS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response,
        query: action.query
      }
    case 'GET_POPULATION_STATISTICS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
        query: action.query
      }
    case 'REMOVE_POPULATION':
      return initialState
    case 'CLEAR_POPULATIONS':
      return initialState
    default:
      return state
  }
}

export default reducer
