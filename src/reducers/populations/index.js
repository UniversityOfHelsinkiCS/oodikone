import { omit } from 'lodash';
import { combineReducers } from 'redux';

import {
  GET_POPULATION_STATISTICS_FULFILLED,
  GET_POPULATION_STATISTICS_REJECTED,
  CLEAR_POPULATIONS, REMOVE_POPULATION
}
  from '../../actions';

const samples = (state = {}, action) => {
  switch (action.type) {
    case GET_POPULATION_STATISTICS_FULFILLED: {
      const { meta, payload } = action;
      return { ...state, [meta.uuid]: payload };
    }
    case GET_POPULATION_STATISTICS_REJECTED: {
      return state;
    }
    case CLEAR_POPULATIONS:
      return {};
    case REMOVE_POPULATION: {
      const { uuid } = action.payload;
      return omit(state, uuid);
    }
    default:
      return state;
  }
};

const queries = (state = [], action) => {
  switch (action.type) {
    case GET_POPULATION_STATISTICS_FULFILLED: {
      const queryObj = action.meta;
      return [...state, queryObj];
    }
    case CLEAR_POPULATIONS:
      return [];
    case REMOVE_POPULATION: {
      const { uuid } = action.payload;
      return state.filter(query => query.uuid !== uuid);
    }
    default:
      return state;
  }
};

export default combineReducers({
  samples,
  queries
});
