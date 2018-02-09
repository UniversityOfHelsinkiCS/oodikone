import { combineReducers } from 'redux';
import asyncReducer from '../asyncReducer';

import {
  FIND_STUDENTS,
  GET_STUDENT,
  GET_STUDENT_FULFILLED,
  REMOVE_TAG_FROM_STUDENT_FULFILLED,
  REMOVE_TAG_FROM_STUDENT_REJECTED,
  ADD_TAG_TO_STUDENT_FULFILLED,
  ADD_TAG_TO_STUDENT_REJECTED
} from '../../actions';

const selectedStudent = (state = {}, action) => {
  switch (action.type) {
    case GET_STUDENT_FULFILLED: {
      const student = action.payload;
      return { ...student };
    }
    case ADD_TAG_TO_STUDENT_FULFILLED: {
      const { tag } = action.meta;
      return {
        ...state,
        tags: state.tags.concat(tag)
      };
    }
    case ADD_TAG_TO_STUDENT_REJECTED:
      return state;
    case REMOVE_TAG_FROM_STUDENT_FULFILLED: {
      const { tag } = action.meta;
      return {
        ...state,
        tags: state.tags.filter(t => t !== tag)
      };
    }
    case REMOVE_TAG_FROM_STUDENT_REJECTED: {
      return state;
    }
    default:
      return state;
  }
};

export default combineReducers({
  selectedStudent,
  findStudents: asyncReducer(FIND_STUDENTS),
  getStudent: asyncReducer(GET_STUDENT)
});
