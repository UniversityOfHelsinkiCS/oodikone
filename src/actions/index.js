import {
  getDepartmentSuccess,
  findStudents,
  findCoursesByName,
  getStudent,
  findTags,
  removeTagFromStudent,
  addTagToStudent,
  postForGetPopulationStatistics
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
export const GET_POPULATION_STATISTICS = 'GET_POPULATION_STATISTICS';
export const GET_POPULATION_STATISTICS_FULFILLED = 'GET_POPULATION_STATISTICS_FULFILLED';
export const GET_POPULATION_STATISTICS_REJECTED = 'GET_POPULATION_STATISTICS_REJECTED';
export const ADD_NEW_POPULATION_QUERY = 'ADD_NEW_POPULATION_QUERY';
export const CLEAR_POPULATIONS = 'CLEAR_POPULATIONS';
export const REMOVE_POPULATION = 'REMOVE_POPULATION';

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

export const getPopulationStatisticsAction = query => ({
  type: GET_POPULATION_STATISTICS,
  meta: { ...query },
  payload: postForGetPopulationStatistics(query)
});

export const clearPopulationsAction = () => ({
  type: CLEAR_POPULATIONS
});

export const removePopulationAction = uuid => ({
  type: REMOVE_POPULATION,
  payload: { uuid }
});
