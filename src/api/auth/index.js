import { API_BASE_PATH } from '../../constants';
import { catchErrorsIntoJSON, checkForErrors } from '../common';

const OODI_TOKEN = 'oodi_token';

const saveLogin = res => res.json().then((response) => {
  localStorage.setItem(OODI_TOKEN, response.token);
  return response.token;
});


export const login = (user) => {
  let query = `${API_BASE_PATH}/login/`;
  if (process.env.NODE_ENV === 'development') {
    const devUser = user || 'tktl';
    query = `${query}${devUser}`;
  }
  return fetch(query, {
    credentials: 'same-origin',
    'Cache-Control': 'no-cache'
  })
    .then(checkForErrors)
    .then(saveLogin)
    .catch(err => catchErrorsIntoJSON(err, true));
};


export const cleanToken = () => {
  localStorage.removeItem(OODI_TOKEN);
};

export const logout = () => {
  // logout from backend to get redirect url??
  cleanToken();
  window.location = '/';
};

export const checkAuth = () => {
  const token = localStorage.getItem(OODI_TOKEN) || null;
  return token ? Promise.resolve(token) : login();
};
