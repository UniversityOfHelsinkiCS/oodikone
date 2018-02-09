import { ADD_ERROR } from '../../actions/index';

function addErrorToState(err, state) {
  const newState = state.slice();
  newState.push(err);
  return newState;
}

export default (state = [], action) => {
  const {
    type, error, payload, errorJson
  } = action;

  // Error is handled else where
  if (payload && !payload.catchRejected) {
    return state;

  // Manually added errors
  } else if (type === ADD_ERROR) {
    return addErrorToState(errorJson.error, state);

  // Received JSON errors
  } else if (payload && payload.error) {
    return addErrorToState(payload.error, state);

  // Responses not in JSON (e.g. Gateway timeouts)
  } else if (error) {
    let message = payload.statusText;
    if (payload.stack) {
      message = `${message} : ${payload.stack}`;
    }
    const err = {
      message,
      code: payload.status || 500,
      url: payload.url
    };
    return addErrorToState(err, state);
  }
  return state;
};
