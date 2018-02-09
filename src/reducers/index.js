import { combineReducers } from 'redux';
import { localeReducer as locale } from 'react-localize-redux';

import departmentSuccess from './departmentSuccess';
import students from './students';
import populations from './populations';
import tags from './tags';
import errorReducer from './errorReducer';


/* collect reducers here from subfolders */
export default combineReducers({
  departmentSuccess,
  locale,
  studentReducer: students,
  populationReducer: populations,
  tags,
  errors: errorReducer
});
