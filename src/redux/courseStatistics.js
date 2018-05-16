import { callController } from '../apiConnection'

export const getCourseStatistics = ({ code, start, end, separate }) => {
  const route = `/courseyearlystats/?start=${start}&code=${code}&end=${end}&separate=${separate}`
  const prefix = 'FIND_COURSE_STATISTICS_'
  return callController(route, prefix)
}

export const clearCouresStatistics = () => ({
  type: 'CLEAR_COURSE_STATISTICS'
})

export const removeCourseStatistics = ({ end, start, separate, code }) => ({
  type: 'REMOVE_COURSE_STATISTICS',
  end,
  start,
  separate,
  code
})

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
        selected: [...state.selected, {
          code: action.response.code,
          start: action.response.start,
          end: action.response.end,
          separate: action.response.separate,
          name: action.response.name
        }],
        data: [...state.data, action.response]
      }
    case 'REMOVE_COURSE_STATISTICS':
      return {
        pending: false,
        error: false,
        selected: [...state.selected.filter(query => query.code !== action.code ||
          query.start !== action.start ||
          query.end !== action.end ||
          query.separate !== action.separate)],
        data: [...state.data.filter(query => query.code !== action.code ||
          query.start !== action.start ||
          query.end !== action.end ||
          query.separate !== action.separate)]
      }
    case 'CLEAR_COURSE_STATISTICS':
      return { data: [], selected: [] }
    default:
      return state
  }
}

export default reducer
