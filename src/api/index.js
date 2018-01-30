import { getJson } from '../common';

const throwErrors = (res) => {
  if (res.ok === false || res.error) {
    throw res;
  }

  return res;
};

export const getDepartmentSuccess = date => getJson(`/departmentsuccess/?date=${date}`).then(throwErrors);

export const findStudents = searchStr => getJson(`/students?searchTerm=${searchStr}`).then(throwErrors);

export const findCoursesByName = searchStr => getJson(`/courses?name=${searchStr}`).then(throwErrors);

export const findCourseInstances = code => getJson(`/courselist?code=${code}`).then(throwErrors);

export const getInstanceStatistics = (date, code, months) => getJson(`/coursestatistics?date=${date}&code=${code}&months=${months}`).then(throwErrors);
