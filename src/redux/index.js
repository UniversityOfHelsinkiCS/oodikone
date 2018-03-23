import { combineReducers } from 'redux';

import department from './department';
import users from './users';
import populations from './populations';
import tags from './tags';
import units from './units';
import students from './students';

export default combineReducers({
  department,
  users,
  populations,
  tags,
  units,
  students
});
