import { callController } from '../apiConnection'

export const findStudents = searchStr => {
  const route = `/students/?searchTerm=${searchStr}`
  const prefix = 'FIND_STUDENTS_'
  return callController(route, prefix, undefined, undefined, searchStr)
}

export const getStudent = studentNumber => {
  const route = `/students/${studentNumber}`
  const prefix = 'GET_STUDENT_'
  return callController(route, prefix)
}

export const selectStudent = studentNumber => ({
  type: 'SELECT_STUDENT_SUCCESS',
  response: studentNumber,
})

export const removeStudentSelection = () => ({
  type: 'REMOVE_SELECTED_SUCCESS',
})

export const resetStudent = () => ({
  type: 'RESET_STUDENT_SUCCESS',
})

const reducer = (state = { data: [], pending: false, error: false, fetching: false }, action) => {
  switch (action.type) {
    case 'FIND_STUDENTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        selected: state.selected,
        lastSearch: action.requestSettings.query,
        data: state.data,
      }
    case 'FIND_STUDENTS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        selected: state.selected,
        lastSearch: state.lastSearch,
        data: state.data,
      }
    case 'FIND_STUDENTS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        selected: state.selected,
        lastSearch: state.lastSearch,
        data:
          state.lastSearch === action.query
            ? [...state.data.filter(student => student.fetched), ...action.response]
            : state.data,
      }
    case 'GET_STUDENT_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        fetching: true,
      }
    case 'GET_STUDENT_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        fetching: false,
      }
    case 'GET_STUDENT_SUCCESS':
      return {
        pending: false,
        error: false,
        fetching: false,
        selected: action.response.studentNumber,
        lastSearch: state.lastSearch,
        data: [
          ...state.data.filter(student => student.studentNumber !== action.response.studentNumber),
          { ...action.response, ...{ fetched: true } },
        ],
      }
    case 'SELECT_STUDENTS_SUCCESS':
      return { ...state, selected: action.response }
    case 'RESET_STUDENT_SUCCESS':
      return { ...state, data: [], lastSearch: '', error: false, pending: false }
    case 'REMOVE_SELECTED_SUCCESS':
      return { ...state, selected: null }
    default:
      return state
  }
}

export default reducer
