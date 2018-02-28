import {
  getDepartmentSuccess,
  findStudents,
  getStudent,
  findTags,
  removeTagFromStudent,
  addTagToStudent,
  findCoursesByName,
  findCourseInstances,
  getInstanceStatistics,
  getStudyProgrammes,
  getPopulationStatistics
} from '../api';

export const ADD_ERROR = 'ADD_ERROR';
export const REMOVE_ERROR = 'REMOVE_ERROR';
export const GET_DEPARTMENT_SUCCESS = 'GET_DEPARTMENT_SUCCESS';
export const FIND_STUDENTS = 'FIND_STUDENTS';
export const GET_STUDENT = 'GET_STUDENT';
export const GET_STUDENT_FULFILLED = 'GET_STUDENT_FULFILLED';
export const FIND_COURSES = 'FIND_COURSES';
export const FIND_TAGS = 'FIND_TAGS';
export const REMOVE_TAG_FROM_STUDENT = 'REMOVE_TAG_FROM_STUDENT';
export const REMOVE_TAG_FROM_STUDENT_FULFILLED = 'REMOVE_TAG_FROM_STUDENT_FULFILLED';
export const REMOVE_TAG_FROM_STUDENT_REJECTED = 'REMOVE_TAG_FROM_STUDENT_REJECTED';
export const ADD_TAG_TO_STUDENT = 'ADD_TAG_TO_STUDENT';
export const ADD_TAG_TO_STUDENT_FULFILLED = 'ADD_TAG_TO_STUDENT_FULFILLED';
export const ADD_TAG_TO_STUDENT_REJECTED = 'ADD_TAG_TO_STUDENT_REJECTED';
export const GET_POPULATION_STATISTICS = 'GET_POPULATION_STATISTICS';
export const GET_POPULATION_STATISTICS_FULFILLED = 'GET_POPULATION_STATISTICS_FULFILLED';
export const GET_POPULATION_STATISTICS_REJECTED = 'GET_POPULATION_STATISTICS_REJECTED';
export const CLEAR_POPULATIONS = 'CLEAR_POPULATIONS';
export const REMOVE_POPULATION = 'REMOVE_POPULATION';
export const GET_STUDY_PROGRAMMES = 'GET_STUDY_PROGRAMMES';
export const GET_STUDY_PROGRAMMES_FULFILLED = 'GET_STUDY_PROGRAMMES_FULFILLED';
export const FIND_INSTANCES = 'FIND_INSTANCES';
export const GET_INSTANCE_STATS = 'GET_INSTANCE_STATISTICS';

export const addError = errorJson => ({
  type: ADD_ERROR,
  errorJson
});

export const removeError = uuid => ({
  type: REMOVE_ERROR,
  payload: { uuid }
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
  meta: { studentNumber, tag: tag.text },
  payload: removeTagFromStudent(studentNumber, tag)
});

export const addTagToStudentAction = (studentNumber, tag) => ({
  type: ADD_TAG_TO_STUDENT,
  meta: { studentNumber, tag: tag.text },
  payload: addTagToStudent(studentNumber, tag)
});

export const getPopulationStatisticsAction = query => ({
  type: GET_POPULATION_STATISTICS,
  meta: { ...query },
  payload: getPopulationStatistics(query)
});

export const clearPopulationsAction = () => ({
  type: CLEAR_POPULATIONS
});

export const removePopulationAction = uuid => ({
  type: REMOVE_POPULATION,
  payload: { uuid }
});

export const getStudyProgrammesAction = () => ({
  type: GET_STUDY_PROGRAMMES,
  payload: getStudyProgrammes()
});

export const findInstancesAction = code => ({
  type: FIND_INSTANCES,
  payload: findCourseInstances(code)
});

export const getInstanceStatisticsAction = (date, code, months) => ({
  type: GET_INSTANCE_STATS,
  payload: getInstanceStatistics(date, code, months)
});
