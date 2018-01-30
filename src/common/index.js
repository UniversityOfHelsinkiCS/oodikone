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

export const postJsonGetJson = (path, json, catchRejected = true) =>
  fetch(`${API_BASE_PATH}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    'Cache-Control': 'no-cache',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(json)
  })
    .then(checkForErrors)
    .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));
