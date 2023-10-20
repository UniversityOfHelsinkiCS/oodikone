import { RTKApi, callController } from '../apiConnection/index'

const singleCourseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSingleCourseStats: builder.query({
      query: ({ courseCodes, separate }) =>
        `/v3/courseyearlystats?${courseCodes.map(code => `codes[]=${code}`).join('&')}&separate=${separate}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetSingleCourseStatsQuery } = singleCourseStatsApi

export const setSelectedCourse = code => ({
  type: 'SET_SELECTED_COURSE',
  selectedCourse: code,
})

export const clearSelectedCourse = () => ({
  type: 'CLEAR_SELECTED_COURSE',
})

export const getMaxYearsToCreatePopulationFrom = ({ courseCodes }) => {
  const route = '/v3/populationstatistics/maxYearsToCreatePopulationFrom'
  const params = {
    courseCodes,
  }

  return callController(route, 'GET_MAX_YEARS_TO_CREATE_POPULATION_FROM_', null, 'get', null, params)
}

const reducer = (
  state = { stats: {}, pending: false, error: false, selectedCourse: null, maxYearsToCreatePopulationFrom: -1 },
  action
) => {
  switch (action.type) {
    case 'SET_SELECTED_COURSE':
      return {
        ...state,
        selectedCourse: action.selectedCourse,
      }
    case 'CLEAR_SELECTED_COURSE':
      return {
        ...state,
        selectedCourse: null,
      }
    case 'GET_MAX_YEARS_TO_CREATE_POPULATION_FROM_SUCCESS':
      return {
        ...state,
        maxYearsToCreatePopulationFrom: action.response,
      }
    default:
      return state
  }
}

export default reducer
