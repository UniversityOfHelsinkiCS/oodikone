import { callController } from '../apiConnection'

export const getPopulationCourses = ({
  endYear, semesters, studyRights, months, startYear, tag
}) => {
  const route = '/v2/populationstatistics/courses'
  const prefix = 'GET_POPULATION_COURSES_'
  const query = {
    endYear, semesters, studyRights, months, startYear, tag: tag ? tag.tag_id : null
  }
  const body = {
    endYear,
    semesters,
    months,
    studyRights,
    tag: tag ? tag.tag_id : null,
    startYear
  }
  return callController(route, prefix, body, 'post', query)
}

const defaultState = { pending: false, error: false, data: {}, query: {} }
const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: action.requestSettings.query
      }
    case 'GET_POPULATION_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: {},
        query: action.query
      }
    case 'GET_POPULATION_COURSES_SUCCESS':
      return {
        ...state,
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
