import { callController } from '../apiConnection';

export const getDepartmentSuccess = (date) => {
  const route = `/departmentsuccess/?date=${date}`;
  const prefix = 'GET_DEPARTMENT_';
  return callController(route, prefix);
};

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'GET_DEPARTMENT_SUCCESS':
      return action.response;
    default:
      return state;
  }
};

export default reducer;
