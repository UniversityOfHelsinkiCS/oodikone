import { combineReducers } from 'redux';
import asyncReducer from '../asyncReducer';

import {
  FIND_STUDENTS,
  GET_STUDENT
} from '../../actions';


export default combineReducers({
  findStudents: asyncReducer(FIND_STUDENTS),
  getStudent: asyncReducer(GET_STUDENT)
});
