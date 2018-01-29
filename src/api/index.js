import { getJson } from '../common';

const throwErrors = (res) => {
  if (res.ok === false || res.error) {
    throw res;
  }

  return res;
};

export const getDepartmentSuccess = date => getJson(`/departmentsuccess/?date=${date}`).then(throwErrors);

export const findStudents = searchStr => getJson(`/students/?searchTerm=${searchStr}`).then(throwErrors);

export const getStudent = studentNumber => getJson(`/students/${studentNumber}`).then(throwErrors);

export const findCoursesByName = searchStr => getJson(`/courses/?name=${searchStr}`).then(throwErrors);

export const findTags = (searchStr) => {
  const query = searchStr && searchStr.length > 0
    ? `/tags/?query=${searchStr}`
    : '/tags/';
  return getJson(query).then(throwErrors);
};
