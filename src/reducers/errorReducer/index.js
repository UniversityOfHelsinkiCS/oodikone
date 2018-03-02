import uuidv4 from 'uuid/v4';

import { ADD_ERROR, REMOVE_ERROR } from '../../actions';

function addErrorToState(err, state) {
  /* unpure */
  err.uuid = uuidv4();
  if (typeof err.error !== 'string') {
    err.error = 'Something went wrong';
  }
  return [...state, err];
}

export default (state = [], action) => {
  const {
    type, error, payload, errorJson
  } = action;
  // Manually added errors
  if (type === ADD_ERROR) {
    return addErrorToState(errorJson, state);

  // maunually remove error
  } else if (type === REMOVE_ERROR) {
    return state.filter(e => e.uuid !== payload.uuid);

  // Error is handled elsewhere
  } else if (payload && payload.catchRejected === false) {
    return state;
    // Received JSON errors
  } else if (payload && payload.error) {
    return addErrorToState(payload, state);

  // Responses not in JSON (e.g. Gateway timeouts)
  } else if (error) {
    let message = payload.statusText;
    if (payload.stack) {
      message = `${message} : ${payload.stack}`;
    }
    const err = {
      error: message,
      code: payload.status || 500,
      url: payload.url
    };
    return addErrorToState(err, state);
  }
  return state;
};
