import { getJson } from './common';

const throwErrors = (res) => {
  if (res.ok === false || res.error) {
    throw res;
  }

  return res;
};

export const findCoursesByName = searchStr => getJson(`/courses/?name=${searchStr}`).then(throwErrors);

export const findCourseInstances = code => getJson(`/v2/courselist?code=${code}`).then(throwErrors);

export const findStudyrights = searchStr => getJson(`/studyrightkeywords?search=${searchStr}`).then(throwErrors);

export const getInstanceStatistics = (date, code, months) => getJson(`/v2/coursestatistics?date=${date}&code=${code}&months=${months}`).then(throwErrors);
