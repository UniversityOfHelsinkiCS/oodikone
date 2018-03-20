import { combineReducers } from 'redux';

import department from './department';
import population from './population';

export default combineReducers({
  department,
  population
});
