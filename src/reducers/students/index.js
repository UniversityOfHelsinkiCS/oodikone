import { combineReducers } from 'redux';
import asyncReducer from '../asyncReducer';

import {
  FIND_STUDENTS,
  GET_STUDENT,
  GET_STUDENT_FULFILLED,
  REMOVE_TAG_FROM_STUDENT_HACK_SUCCESS,
  REMOVE_TAG_FROM_STUDENT_FULFILLED,
  REMOVE_TAG_FROM_STUDENT_REJECTED,
  ADD_TAG_TO_STUDENT_FULFILLED,
  ADD_TAG_TO_STUDENT_REJECTED
} from '../../actions';


const students = (state = {}, action) => {
  switch (action.type) {
    case GET_STUDENT_FULFILLED: {
      const student = action.payload;
      return { ...state, [student.studentNumber]: student };
    }
    case ADD_TAG_TO_STUDENT_FULFILLED: {
      const studentNumber = action.payload.taggedstudents_studentnumber;
      const addedTag = action.payload.tags_tagname;
      return ({
        ...state,
        ...{
          [studentNumber]: ({
            ...state[studentNumber],
            ...{
              tags: state[studentNumber].tags.concat(addedTag)
            }
          })
        }
      });
    }
    case ADD_TAG_TO_STUDENT_REJECTED:
      return state;
    case REMOVE_TAG_FROM_STUDENT_HACK_SUCCESS: {
      const { studentNumber, tag } = action.payload;
      return ({
        ...state,
        ...{
          [studentNumber]: ({
            ...state[studentNumber],
            ...{
              tags: state[studentNumber].tags.filter(t => t !== tag)
            }
          })
        }
      });
    }
    case REMOVE_TAG_FROM_STUDENT_FULFILLED: {
      return { ...state };
    }
    case REMOVE_TAG_FROM_STUDENT_REJECTED: {
      return { ...state };
    }
    default:
      return state;
  }
};

export default combineReducers({
  students,
  findStudents: asyncReducer(FIND_STUDENTS),
  getStudent: asyncReducer(GET_STUDENT)
});
