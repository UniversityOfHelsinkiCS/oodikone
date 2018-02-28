import { combineReducers } from 'redux';

import { GET_STUDY_PROGRAMMES_FULFILLED } from '../../actions';

const studyProgrammes = (state = [], action) => {
  if (action.type === GET_STUDY_PROGRAMMES_FULFILLED) {
    return action.payload;
  }
  return state;
};

export default combineReducers({
  studyProgrammes
});
