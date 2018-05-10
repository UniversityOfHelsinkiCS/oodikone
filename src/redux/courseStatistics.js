import { callController } from '../apiConnection'

export const getCourseStatistics = ({ code, start, end, separate }) => {
  const route = `/courseyearlystats/?start=${start}&code=${code}&end=${end}&separate=${separate}`
  const prefix = 'FIND_COURSE_STATISTICS_'
  return callController(route, prefix)
}

const reducer = (state = { data: [], selected: [] }, action) => {
  switch (action.type) {
    case 'FIND_COURSE_STATISTICS_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSE_STATISTICS_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSE_STATISTICS_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: [...state.selected, action.response.code],
        data: [...state.data, action.response]
      }
    default:
      return state
  }
}

export default reducer
