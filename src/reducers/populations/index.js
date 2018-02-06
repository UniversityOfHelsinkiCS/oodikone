import { combineReducers } from 'redux';

import {
  GET_POPULATION_STATISTICS_FULFILLED,
  GET_POPULATION_STATISTICS_REJECTED,
  ADD_NEW_POPULATION_QUERY
}
  from '../../actions';

const samples = (state = [], action) => {
  switch (action.type) {
    case GET_POPULATION_STATISTICS_FULFILLED: {
      const newPopulation = action.payload;
      return [...state, newPopulation];
    }
    case GET_POPULATION_STATISTICS_REJECTED: {
      return state;
    }
    default:
      return state;
  }
};

const queries = (state = [], action) => {
  switch (action.type) {
    case ADD_NEW_POPULATION_QUERY: {
      const queryObj = action.payload;
      return [...state, queryObj];
    }
    default:
      return state;
  }
};

export default combineReducers({
  samples,
  queries
});
