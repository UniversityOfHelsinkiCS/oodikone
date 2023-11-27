import { callController } from '../apiConnection'

export const getPopulationSelectedStudentCourses = ({
  semesters,
  studentStatuses,
  studyRights,
  months,
  uuid,
  selectedStudents,
  year,
  years,
  tag,
  selectedStudentsByYear,
  courses = [],
}) => {
  const route = !tag ? '/v2/populationstatistics/courses' : '/v2/populationstatistics/coursesbytag'
  const prefix = 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_'
  const query = {
    semesters,
    studentStatuses,
    studyRights,
    uuid,
    selectedStudents,
    months,
    year,
    years,
    tag,
    selectedStudentsByYear,
  }
  const body = {
    semesters,
    studentStatuses,
    months,
    studyRights,
    selectedStudents,
    year,
    tag,
    selectedStudentsByYear,
    years,
    courses,
  }
  return callController(route, prefix, body, 'post', query)
}

export const clearSelected = () => ({
  type: 'CLEAR_SELECTED',
})

const defaultState = { pending: false, error: false, data: null, query: {} }
export const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: action.requestSettings.query,
      }
    case 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: {},
        query: action.query,
      }
    case 'GET_POPULATION_SELECTEDSTUDENTS_COURSES_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
        query: action.query,
      }
    case 'CLEAR_SELECTED':
      return defaultState
    default:
      return state
  }
}
