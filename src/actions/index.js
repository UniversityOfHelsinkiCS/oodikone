import {
  findCoursesByName,
  findCourseInstances,
  getInstanceStatistics
} from '../api';
import { login, logout } from '../api/auth';


export const LOG_OUT = 'LOG_OUT';
export const LOG_IN_DEV = 'LOG_IN_DEV';

export const GET_DEPARTMENT_SUCCESS = 'GET_DEPARTMENT_SUCCESS';
export const FIND_STUDENTS = 'FIND_STUDENTS';
export const FIND_COURSES = 'FIND_COURSES';
export const GET_POPULATION_STATISTICS = 'GET_POPULATION_STATISTICS';
export const GET_POPULATION_STATISTICS_FULFILLED = 'GET_POPULATION_STATISTICS_FULFILLED';
export const GET_POPULATION_STATISTICS_REJECTED = 'GET_POPULATION_STATISTICS_REJECTED';
export const CLEAR_POPULATIONS = 'CLEAR_POPULATIONS';
export const REMOVE_POPULATION = 'REMOVE_POPULATION';
export const GET_STUDY_PROGRAMMES = 'GET_STUDY_PROGRAMMES';
export const GET_STUDY_PROGRAMMES_FULFILLED = 'GET_STUDY_PROGRAMMES_FULFILLED';
export const FIND_INSTANCES = 'FIND_INSTANCES';
export const GET_INSTANCE_STATS = 'GET_INSTANCE_STATISTICS';


export const logDevUserInAction = user => ({
  type: LOG_IN_DEV,
  payload: login(user)
});

export const logUserOutAction = () => ({
  type: LOG_OUT,
  payload: logout()
});

export const findCoursesAction = searchStr => ({
  type: FIND_COURSES,
  payload: findCoursesByName(searchStr)
});

export const findInstancesAction = code => ({
  type: FIND_INSTANCES,
  payload: findCourseInstances(code)
});

export const getInstanceStatisticsAction = (date, code, months) => ({
  type: GET_INSTANCE_STATS,
  payload: getInstanceStatistics(date, code, months)
});
