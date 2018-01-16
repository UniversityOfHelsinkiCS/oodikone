import { combineReducers } from 'redux';
import asyncReducer from '../asyncReducer';

import {
    FIND_STUDENTS
} from "../../actions";


export default combineReducers({
    findStudents: asyncReducer(FIND_STUDENTS)
});
