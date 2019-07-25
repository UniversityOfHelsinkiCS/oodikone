import { callController } from '../apiConnection'

export const getCoursePopulation = ({ coursecode, yearcode }) => {
  const route = '/v3/populationstatisticsbycourse'
  const prefix = 'GET_STUDENTS_OF_COURSE_'
  const params = { coursecode, yearcode }
  const query = { coursecode, yearcode }

  return callController(route, prefix, null, 'get', query, params)
}

export const getCoursePopulationCourses = ({ coursecode, yearcode }) => {
  const route = '/v2/populationstatistics/coursesbycoursecode'
  const prefix = 'GET_COURSES_OF_COURSE_POP_'
  const params = { coursecode, yearcode }
  const query = { coursecode, yearcode }
  const body = { coursecode, yearcode }

  return callController(route, prefix, body, 'post', query, params)
}

const reducer = (state = { students: {}, courses: {} }, action) => {
  switch (action.type) {
    case 'GET_STUDENTS_OF_COURSE_ATTEMPT':
      return {
        ...state,
        pending: true
      }

    case 'GET_STUDENTS_OF_COURSE_FAILURE':
      return {
        ...state,
        pending: false
      }

    case 'GET_STUDENTS_OF_COURSE_SUCCESS':
      return {
        ...state,
        pending: false,
        students: action.response
      }
    case 'GET_COURSES_OF_COURSE_POP_ATTEMPT':
      return {
        ...state,
        pending: true
      }

    case 'GET_COURSES_OF_COURSE_POP_FAILURE':
      return {
        ...state,
        pending: false
      }

    case 'GET_COURSES_OF_COURSE_POP_SUCCESS':
      return {
        ...state,
        pending: false,
        courses: action.response
      }
    default:
      return state
  }
}

export default reducer
