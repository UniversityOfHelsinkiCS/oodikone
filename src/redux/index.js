import { combineReducers } from 'redux';

import department from './department';
import users from './users';
import population from './population';


export default combineReducers({
  department,
  users,
  population
});
