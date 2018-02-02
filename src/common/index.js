import moment from 'moment';
import { DISPLAY_DATE_FORMAT } from '../constants';

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

export const reformatDate = (date, dateFormat) => moment(date).format(dateFormat);

export const sortDatesWithFormat = (d1, d2, dateFormat)
  => moment(d1, dateFormat) - moment(d2, dateFormat);
