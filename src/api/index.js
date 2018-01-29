import { getJson, postToGetJson } from '../common';

const throwErrors = (res) => {
  if (res.ok === false || res.error) {
    throw res;
  }

  return res;
};

export const getDepartmentSuccess = date => getJson(`/departmentsuccess/?date=${date}`).then(throwErrors);

export const findStudents = searchStr => getJson(`/students?searchTerm=${searchStr}`).then(throwErrors);

export const findCoursesByName = searchStr => getJson(`/courses?name=${searchStr}`).then(throwErrors);

export const findCourseInstances = courseCode => postToGetJson('/courselist', { code: courseCode }).then(throwErrors);
