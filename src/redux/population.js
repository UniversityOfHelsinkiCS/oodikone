import { callController } from '../apiConnection';

const getArrayParams = (paramName, entries) => entries.map(entry => `&${paramName}=${entry}`).join('');

export const getPopulationStatistics = ({ year, semester, studyRights }) => {
  const route = `/populationstatistics/?year=${year}&semester=${semester}${getArrayParams('studyRights', studyRights)}`;
  const prefix = 'GET_POPULATION_STATISTICS_';
  const query = { year, semester, studyRights };
  return callController(route, prefix, null, 'get', query);
};

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'GET_POPULATION_STATISTICS_ATTEMPT':
      return [...state, {
        pending: true
      }];
    case 'GET_POPULATION_STATISTICS_FAILURE':
      return [...state.filter(apiCall => !apiCall.pending), {
        pending: false,
        error: true,
        data: action.response,
        query: action.query
      }];
    case 'GET_POPULATION_STATISTICS_SUCCESS':
      return [...state.filter(apiCall => !apiCall.pending), {
        pending: false,
        error: false,
        data: action.response,
        query: action.query
      }];
    default:
      return state;
  }
};

export default reducer;
