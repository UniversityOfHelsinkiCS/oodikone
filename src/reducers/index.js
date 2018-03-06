import { combineReducers } from 'redux';
import { localeReducer as locale } from 'react-localize-redux';

import departmentSuccess from './departmentSuccess';
import students from './students';
import populations from './populations';
import tags from './tags';
import studyProgrammes from './studyProgrammes';
import errorReducer from './errorReducer';
import newReducers from '../redux';

export default combineReducers({
  departmentSuccess,
  locale,
  studentReducer: students,
  populationReducer: populations,
  studyProgrammesReducer: studyProgrammes,
  tags,
  errors: errorReducer,
  newReducers
});
