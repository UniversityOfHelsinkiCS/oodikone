import { callController } from '../apiConnection'

export const getPopulationCourses = ({
  year, semesters, studentStatuses, studyRights, months, uuid, selectedStudents
}) => {
  const route = '/v2/populationstatistics/courses'
  const prefix = 'GET_POPULATION_COURSES_'
  const query = {
    year, semesters, studentStatuses, studyRights, uuid, selectedStudents
  }
  const body = {
    year,
    semesters,
    studentStatuses,
    months,
    studyRights,
    selectedStudents
  }
  return callController(route, prefix, body, 'post', query)
}

export const clearPopulationCourses = () => ({
  type: 'CLEAR_POPULATIONS_COURSES'
})
const defaultState = { pending: false, error: false, data: {}, query: {} }
const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_COURSES_ATTEMPT':
      return { ...state,
        pending: true,
        error: false,
        data: {},
        query: action.requestSettings.query
      }
    case 'GET_POPULATION_COURSES_FAILURE':
      return { ...state,
        pending: false,
        error: true,
        data: action.response || {},
        query: action.query
      }
    case 'GET_POPULATION_COURSES_SUCCESS':
      return { ...state,
        pending: false,
        error: false,
        data: action.response || {},
        query: action.query
      }
    default:
      return state
  }
}

export default reducer
