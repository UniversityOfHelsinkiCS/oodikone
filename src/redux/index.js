import { combineReducers } from 'redux';
import { localeReducer as locale } from 'react-localize-redux';

import department from './department';
import users from './users';
import populations from './populations';
import tags from './tags';
import units from './units';
import students from './students';
import errors from './errors';

export default combineReducers({
  locale,
  department,
  users,
  populations,
  tags,
  units,
  students,
  errors
});
