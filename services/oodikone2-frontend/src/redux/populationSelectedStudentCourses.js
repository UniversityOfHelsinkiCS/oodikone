import { callController } from '../apiConnection'

export const getPopulationSelectedStudentCourses = ({
  endYear, semesters, studentStatuses, studyRights, months, uuid, selectedStudents, startYear, tag
}) => {
  const route = '/v2/populationstatistics/courses'
  const prefix = 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_'
  const query = {
    endYear, semesters, studentStatuses, studyRights, uuid, selectedStudents, months, startYear, tag
  }
  const body = {
    endYear,
    semesters,
    studentStatuses,
    months,
    studyRights,
    selectedStudents,
    startYear,
    tag
  }
  return callController(route, prefix, body, 'post', query)
}

export const clearSelected = () => ({
  type: 'CLEAR_SELECTED'
})

const defaultState = { pending: false, error: false, data: null, query: {} }
const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: action.requestSettings.query
      }
    case 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: {},
        query: action.query
      }
    case 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
        query: action.query
      }
    case 'CLEAR_SELECTED':
      return {
        state: defaultState
      }
    default:
      return state
  }
}

export default reducer
