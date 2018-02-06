import moment from 'moment';

const API_BASE_PATH = '/api';

const toJSON = res =>
  (res.status !== 204 ? res.json() : res);

const catchErrorsIntoJSON = (err, catchRejected) => {
  if (err.status === 401) throw err;

  return err.json().then((data) => {
    data.error.url = err.url;
    data.catchRejected = catchRejected;
    return data;
  }).catch(() => err);
};

const checkForErrors = (res) => {
  if (!res.ok) {
    throw res;
  }

  return res;
};

export const get = path =>
  fetch(`${API_BASE_PATH}${path}`, {
    credentials: 'same-origin',
    'Cache-Control': 'no-cache'
  })
    .then(checkForErrors);

export const getJson = (path, catchRejected = true) => fetch(`${API_BASE_PATH}${path}`, {
  credentials: 'same-origin',
  'Cache-Control': 'no-cache'
})
  .then(checkForErrors)
  .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));

export const deleteItem = (path, data, catchRejected = true) => fetch(`${API_BASE_PATH}${path}`, {
  method: 'DELETE',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin',
  body: JSON.stringify(data)
})
  .then(checkForErrors)
  .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));

export const postJson = (path, data, catchRejected = true) => fetch(`${API_BASE_PATH}${path}`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin',
  body: JSON.stringify(data)
})
  .then(checkForErrors)
  .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));

export const reformatDate = (date, outputFormat) => moment(date).format(outputFormat);

export const sortDatesWithFormat = (d1, d2, dateFormat) =>
  moment(d1, dateFormat) - moment(d2, dateFormat);

/* This should be done in backend */
export const removeInvalidCreditsFromStudent = student => ({
  ...student,
  courses: student.courses.map((course) => {
    if (course.credits > 25) {
      course.credits = 0;
    }
    return course;
  })
});

export const removeInvalidCreditsFromStudents = students =>
  students.map(student => removeInvalidCreditsFromStudent(student));

export const removeInvalidCreditsFromSamples = samples =>
  samples.map(students => removeInvalidCreditsFromStudents(students));

export const getStudentTotalCredits = student => student.courses.reduce((a, b) => a + b.credits, 0);
/* ******************** */
