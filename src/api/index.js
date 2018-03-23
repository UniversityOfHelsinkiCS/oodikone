import { getJson, deleteItem, postJson } from './common';

const getArrayParams = (paramName, entries) => entries.map(entry => `&${paramName}=${entry}`).join('');

const throwErrors = (res) => {
  if (res.ok === false || res.error) {
    throw res;
  }

  return res;
};
/*
export const getDepartmentSuccess = date =>
getJson(`/departmentsuccess/?date=${date}`).then(throwErrors);

export const findStudents = searchStr =>
getJson(`/students/?searchTerm=${searchStr}`).then(throwErrors);

export const getStudent = studentNumber => getJson(`/students/${studentNumber}`).then(throwErrors);

export const getStudyProgrammes = () => getJson('/studyprogrammes').then(throwErrors);

*/
export const findCoursesByName = searchStr => getJson(`/courses/?name=${searchStr}`).then(throwErrors);

export const findTags = (searchStr) => {
  const query = searchStr && searchStr.length > 0
    ? `/tags/?query=${searchStr}`
    : '/tags/';
  return getJson(query).then(throwErrors);
};

export const removeTagFromStudent = (studentNumber, tag) => deleteItem(`/students/${studentNumber}/tags`, tag)
  .then(throwErrors);

export const addTagToStudent = (studentNumber, tag) => postJson(`/students/${studentNumber}/tags`, tag).then(throwErrors);

export const getPopulationStatistics = (query) => {
  const { year, semester, studyRights } = query;
  const q = `/populationstatistics/?year=${year}&semester=${semester}${getArrayParams('studyRights', studyRights)}`;
  return getJson(q).then(throwErrors);
};

export const findCourseInstances = code => getJson(`/v2/courselist?code=${code}`).then(throwErrors);

export const findStudyrights = searchStr => getJson(`/studyrightkeywords?search=${searchStr}`).then(throwErrors);

export const getInstanceStatistics = (date, code, months) => getJson(`/v2/coursestatistics?date=${date}&code=${code}&months=${months}`).then(throwErrors);
