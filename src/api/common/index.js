import { API_BASE_PATH } from '../../constants'
import { checkAuth, cleanToken } from '../auth'

const toJSON = res =>
  (res.status !== 204 ? res.json() : res)

export const catchErrorsIntoJSON = (err, catchRejected) => {
  if (err.status === 401) throw err

  // clean local storage in case of old token
  if (err.status === 403) {
    cleanToken()
    throw err
  }
  try {
    return err.json().then((data) => {
      data.code = err.status
      data.url = err.url
      data.catchRejected = catchRejected
      return data
    }).catch(() => err)
    // fallback for fetch errors
  } catch (e) {
    if (err instanceof TypeError) {
      return {
        code: 503,
        error: `${err.message} ${err.stack}`,
        catchRejected
      }
    }
  }
  return err
}

export const checkForErrors = (res) => {
  if (!res.ok) {
    throw res
  }

  return res
}

const getHeaders = (auth, isContentType = false) => {
  const headers = {
    'x-access-token': auth.token
  }
  if (auth.devUser) {
    headers.eduPersonPrincipalName = `${auth.devUser}@secondParams`
  }
  if (isContentType) {
    headers.Accept = 'application/json'
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

export const get = path => checkAuth().then(auth =>
  fetch(`${API_BASE_PATH}${path}`, {
    headers: getHeaders(auth),
    'Cache-Control': 'no-cache',
    credentials: 'same-origin'
  }))
  .then(checkForErrors)

export const getJson = (path, catchRejected = true) => checkAuth().then(auth =>
  fetch(`${API_BASE_PATH}${path}`, {
    headers: getHeaders(auth),
    'Cache-Control': 'no-cache',
    credentials: 'same-origin'
  }))
  .then(checkForErrors)
  .then(toJSON)
  .catch(err => catchErrorsIntoJSON(err, catchRejected))

export const deleteItem = (path, data, catchRejected = true) => checkAuth().then(auth => fetch(`${API_BASE_PATH}${path}`, {
  method: 'DELETE',
  headers: getHeaders(auth),
  credentials: 'same-origin',
  body: JSON.stringify(data)
}))
  .then(checkForErrors)
  .then(toJSON)
  .catch(err => catchErrorsIntoJSON(err, catchRejected))

export const postJson = (path, data, catchRejected = true) => checkAuth().then(auth => fetch(`${API_BASE_PATH}${path}`, {
  method: 'POST',
  headers: getHeaders(auth),
  credentials: 'same-origin',
  body: JSON.stringify(data)
}))
  .then(checkForErrors)
  .then(toJSON)
  .catch(err => catchErrorsIntoJSON(err, catchRejected))

/* ******************** */

export const postJsonGetJson = (path, json, catchRejected = true) => checkAuth().then(auth =>
  fetch(`${API_BASE_PATH}${path}`, {
    method: 'POST',
    'Cache-Control': 'no-cache',
    credentials: 'same-origin',
    headers: getHeaders(auth),
    body: JSON.stringify(json)
  }))
  .then(checkForErrors)
  .then(toJSON)
  .catch(err => catchErrorsIntoJSON(err, catchRejected))

