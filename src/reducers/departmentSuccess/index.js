import { combineReducers } from 'redux';
import asyncReducer from '../asyncReducer';

import {
  GET_DEPARTMENT_SUCCESS
} from '../../actions';


export default combineReducers({
  getDepartmentSuccess: asyncReducer(GET_DEPARTMENT_SUCCESS)
});
