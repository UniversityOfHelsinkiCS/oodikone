import { combineReducers } from 'redux';

import department from './department';
import users from './users';
import population from './population';
import tags from './tags';
import units from './units';

export default combineReducers({
  department,
  users,
  population,
  tags,
  units
});
