import { combineReducers } from 'redux';
import { localeReducer as locale } from 'react-localize-redux';

import departmentSuccess from './departmentSuccess';
import studentStatistics from './studentStatistics';
import tags from './tags';

import {

} from '../actions';

/* collect reducers here from subfolders */
const reducers = combineReducers({
  departmentSuccess,
  locale,
  studentStatistics,
  tags
});

export default reducers;
