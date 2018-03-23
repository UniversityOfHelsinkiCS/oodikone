import { callController } from '../apiConnection';

export const findCourses = (searchStr) => {
  const route = `/courses/?name=${searchStr}`;
  const prefix = 'FIND_COURSES_';
  return callController(route, prefix);
};

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'FIND_COURSES_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: []
      };
    case 'FIND_COURSES_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      };
    case 'FIND_COURSES_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.code,
        data: action.response
      };

    default:
      return state;
  }
};

export default reducer;
