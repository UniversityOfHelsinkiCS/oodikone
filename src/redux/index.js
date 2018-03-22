import { combineReducers } from 'redux';

import department from './department';
import users from './users';

export default combineReducers({
  department,
  users
});
