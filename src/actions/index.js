import {
  getDepartmentSuccess,
  findStudents,
  findCoursesByName,
  getStudent,
  findTags,
  removeTagFromStudent, addTagToStudent
} from '../api';

export const ADD_ERROR = 'ADD_ERROR';
export const GET_DEPARTMENT_SUCCESS = 'GET_DEPARTMENT_SUCCESS';
export const FIND_STUDENTS = 'FIND_STUDENTS';
export const GET_STUDENT = 'GET_STUDENT';
export const GET_STUDENT_FULFILLED = 'GET_STUDENT_FULFILLED';
export const FIND_COURSES = 'FIND_COURSES';
export const FIND_TAGS = 'FIND_TAGS';
export const REMOVE_TAG_FROM_STUDENT = 'REMOVE_TAG_FROM_STUDENT';
export const REMOVE_TAG_FROM_STUDENT_FULFILLED = 'REMOVE_TAG_FROM_STUDENT_FULFILLED';
export const REMOVE_TAG_FROM_STUDENT_REJECTED = 'REMOVE_TAG_FROM_STUDENT_REJECTED';
export const REMOVE_TAG_FROM_STUDENT_HACK_SUCCESS = 'REMOVE_TAG_FROM_STUDENT_HACK_SUCCESS';
export const ADD_TAG_TO_STUDENT = 'ADD_TAG_TO_STUDENT';
export const ADD_TAG_TO_STUDENT_FULFILLED = 'ADD_TAG_TO_STUDENT_FULFILLED';
export const ADD_TAG_TO_STUDENT_REJECTED = 'ADD_TAG_TO_STUDENT_REJECTED';

export const addError = errorJson => ({
  type: ADD_ERROR,
  errorJson
});

export const getDepartmentSuccessAction = date => ({
  type: GET_DEPARTMENT_SUCCESS,
  payload: getDepartmentSuccess(date)
});

export const findStudentsAction = searchStr => ({
  type: FIND_STUDENTS,
  payload: findStudents(searchStr)
});

export const getStudentAction = studentNumber => ({
  type: GET_STUDENT,
  payload: getStudent(studentNumber)
});

export const findCoursesAction = searchStr => ({
  type: FIND_COURSES,
  payload: findCoursesByName(searchStr)
});

export const findTagsAction = searchStr => ({
  type: FIND_TAGS,
  payload: findTags(searchStr)
});

export const removeTagFromStudentAction = (studentNumber, tag) => ({
  type: REMOVE_TAG_FROM_STUDENT,
  payload: removeTagFromStudent(studentNumber, tag)
});

export const removeTagFromStudentHackSuccessAction = (studentNumber, tag) => ({
  type: REMOVE_TAG_FROM_STUDENT_HACK_SUCCESS,
  payload: { studentNumber, tag }
});

export const addTagToStudentAction = (studentNumber, tag) => ({
  type: ADD_TAG_TO_STUDENT,
  payload: addTagToStudent(studentNumber, tag)

});
