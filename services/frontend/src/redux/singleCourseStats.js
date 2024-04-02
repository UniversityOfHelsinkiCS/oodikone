import { RTKApi } from '@/apiConnection'

const singleCourseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSingleCourseStats: builder.query({
      query: ({ courseCodes, separate, combineSubstitutions }) =>
        `/v3/courseyearlystats?${courseCodes
          .map(code => `codes[]=${code}`)
          .join('&')}&separate=${separate}&combineSubstitutions=${combineSubstitutions}`,
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

export const reducer = (state = { stats: {}, pending: false, error: false, selectedCourse: null }, action) => {
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
    default:
      return state
  }
}
