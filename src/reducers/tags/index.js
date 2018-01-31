import { combineReducers } from 'redux';
import asyncReducer from '../asyncReducer';

import {
  FIND_TAGS
} from '../../actions';


export default combineReducers({
  findStudents: asyncReducer(FIND_TAGS)
});
