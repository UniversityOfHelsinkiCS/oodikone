import { API_BASE_PATH } from '../../constants';
import { catchErrorsIntoJSON, checkForErrors } from '../common';

const OODI_TOKEN = 'oodi_token';
const OODI_DEV_USER = 'oodi_dev_user';

const isDevEnv = process.env.NODE_ENV === 'development';

const saveLogin = res => res.json().then((response) => {
  localStorage.setItem(OODI_TOKEN, response.token);
  if (isDevEnv) {
    response.devUser = localStorage.getItem(OODI_DEV_USER);
  }
  return response;
});

// eduPersonPrincipalName => user@


export const login = (user) => {
  const request = {
    'Cache-Control': 'no-cache',
    credentials: 'same-origin'
  };
  if (isDevEnv) {
    const devUser = user || 'tktl';
    localStorage.setItem(OODI_DEV_USER, devUser);
    request.headers = {
      eduPersonPrincipalName: `${devUser}@`,
      'shib-session-id': 'mock-session'
    };
  }
  return fetch(`${API_BASE_PATH}/login`, request)
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
  const auth = {};
  auth.token = localStorage.getItem(OODI_TOKEN) || null;
  if (isDevEnv) {
    auth.devUser = localStorage.getItem(OODI_DEV_USER);
  }
  return auth.token ? Promise.resolve(auth) : login();
};
