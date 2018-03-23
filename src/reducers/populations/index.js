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
    default:
      return state;
  }
};

const queries = (state = [], action) => {
  switch (action.type) {
    default:
      return state;
  }
};

export default combineReducers({
  samples,
  queries
});
