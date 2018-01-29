import {
  getDepartmentSuccess,
  findStudents,
  findCoursesByName,
  findCourseInstances
} from '../api';

export const ADD_ERROR = 'ADD_ERROR';
export const GET_DEPARTMENT_SUCCESS = 'GET_DEPARTMENT_SUCCESS';
export const FIND_STUDENTS = 'FIND_STUDENTS';
export const FIND_COURSES = 'FIND_COURSES';
export const FIND_INSTANCES = 'FIND_INSTANCES';

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

export const findCoursesAction = searchStr => ({
  type: FIND_COURSES,
  payload: findCoursesByName(searchStr)
});

export const findInstancesAction = code => ({
  type: FIND_INSTANCES,
  payload: findCourseInstances(code)
});
