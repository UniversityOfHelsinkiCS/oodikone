import { callController } from '../apiConnection'

export const getCoursePopulation = ({ coursecode, yearcode }) => {
  const route = '/v3/populationstatisticsbycourse'
  const prefix = 'GET_STUDENTS_OF_COURSE_'
  const params = { coursecode, yearcode }
  const query = { coursecode, yearcode }

  return callController(route, prefix, null, 'get', query, params)
}
const reducer = (state = { data: {} }, action) => {
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
        data: action.response
      }
    default:
      return state
  }

}
export default reducer