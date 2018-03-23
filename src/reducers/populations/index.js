import { combineReducers } from 'redux';

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
