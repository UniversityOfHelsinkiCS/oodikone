import { callController } from '../apiConnection';

export const findStudents = (searchStr) => {
  const route = `/students/?searchTerm=${searchStr}`;
  const prefix = 'FIND_STUDENTS_';
  return callController(route, prefix);
}

export const getStudent = (studentNumber) => {
  const route = `/students/${studentNumber}`;
  const prefix = 'GET_STUDENT_';
  return callController(route, prefix);
};

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'FIND_STUDENTS_ATTEMPT':
      return {
        pending: true,
        data: [...state.data.filter(student => student.fetched)]
      };
    case 'FIND_STUDENTS_FAILURE':
      return {
        pending: false,
        error: true,
        data: state.data
      };
    case 'FIND_STUDENTS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: [...state.data, ...action.response]
      };
    case 'GET_STUDENT_SUCCESS':
      return {
        pending: state.pending,
        error: state.error,
        data: [...state.data.filter(student =>
          student.studentNumber !== action.response.studentNumber),
        { ...action.response, ...{ fetched: true } }
        ]
      };
    default:
      return state;
  }
};

export default reducer;
