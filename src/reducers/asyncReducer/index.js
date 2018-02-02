const initialState = {
  pending: false,
  error: false,
  data: null
};

const asyncReducer = actionTypename =>
  (state = initialState, action) => {
    switch (action.type) {
      case `${actionTypename}_PENDING`:
        return ({ ...state, ...{ pending: true, error: false, data: null } });
      case `${actionTypename}_FULFILLED`: {
        let error = false;

        if (action.payload && action.payload.error) {
          error = true;
        }

        return ({ ...state, ...{ pending: false, error, data: action.payload } });
      }
      case `${actionTypename}_REJECTED`:
        return ({ ...state, ...{ pending: false, error: true, data: action.payload } });
      default:
        return state;
    }
  };

export default asyncReducer;
