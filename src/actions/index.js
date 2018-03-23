import { login, logout } from '../api/auth';

export const LOG_OUT = 'LOG_OUT';
export const LOG_IN_DEV = 'LOG_IN_DEV';


export const logDevUserInAction = user => ({
  type: LOG_IN_DEV,
  payload: login(user)
});

export const logUserOutAction = () => ({
  type: LOG_OUT,
  payload: logout()
});
