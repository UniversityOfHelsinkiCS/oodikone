import { callController } from '../apiConnection'

export const findCourseInstances = (code) => {
  const route = `/v2/courselist?code=${code}`
  const prefix = 'FIND_COURSE_INSTANCES_'
  return callController(route, prefix)
}

export const getCourseInstanceStatistics = (query) => {
  const { date, code, months } = query
  const route = `/v2/courseinstancestatistics?date=${date}&code=${code}&months=${months}`
  const prefix = 'GET_COURSE_INSTANCE_STATISTICS_'
  return callController(route, prefix, null, 'get', query)
}

export const removeInstance = instanceId => ({
  type: 'REMOVE_INSTANCE',
  instanceId
})

const reducer = (state = { data: [], selected: [] }, action) => {
  switch (action.type) {
    case 'FIND_COURSE_INSTANCES_ATTEMPT':
      return {
        pending: true,
        selected: state.selected,
        data: [] // state.data.filter(instance => instance.statistics)
      }
    case 'FIND_COURSE_INSTANCES_FAILURE':
      return {
        pending: false,
        error: true,
        selected: state.selected,
        data: state.data
      }
    case 'FIND_COURSE_INSTANCES_SUCCESS':
      return {
        pending: false,
        selected: state.selected,
        data: [...state.data, ...action.response]
      }
    case 'GET_COURSE_INSTANCE_STATISTICS_SUCCESS':
      return {
        pending: false,
        error: false,
        selected: [...state.selected, action.query.id],
        data: [...state.data.filter(instance =>
          instance.id !== action.query.id),
        {
          ...state.data.find(instance => instance.id === action.query.id),
          ...{
            statistics: { ...action.response, query: action.query },
            course: action.query.course
          }
        }
        ]
      }
    case 'REMOVE_INSTANCE':
      return { ...state, selected: state.selected.filter(id => id !== action.instanceId) }
    default:
      return state
  }
}

export default reducer
