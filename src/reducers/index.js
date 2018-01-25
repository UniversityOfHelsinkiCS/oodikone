import { combineReducers } from 'redux';
import { localeReducer as locale } from 'react-localize-redux';

import departmentSuccess from './departmentSuccess';

import {

} from '../actions';

/* collect reducers here from subfolders */
const reducers = combineReducers({
  departmentSuccess,
  locale
});

export default reducers;
