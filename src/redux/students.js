import { callController } from '../apiConnection'

export const findStudents = (searchStr) => {
  const route = `/students/?searchTerm=${searchStr}`
  const prefix = 'FIND_STUDENTS_'
  return callController(route, prefix)
}

export const getStudent = (studentNumber) => {
  const route = `/students/${studentNumber}`
  const prefix = 'GET_STUDENT_'
  return callController(route, prefix)
}

export const selectStudent = studentNumber => ({
  type: 'SELECT_STUDENT_SUCCESS',
  response: studentNumber
})

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'FIND_STUDENTS_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_STUDENTS_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_STUDENTS_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: state.selected,
        data: [...state.data.filter(student => student.fetched), ...action.response]
      }
    case 'GET_STUDENT_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: action.response.studentNumber,
        data: [...state.data.filter(student =>
          student.studentNumber !== action.response.studentNumber),
        { ...action.response, ...{ fetched: true } }
        ]
      }
    case 'SELECT_STUDENT_SUCCESS':
      return { ...state, selected: action.response }
    default:
      return state
  }
}

export default reducer
