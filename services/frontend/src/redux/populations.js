import { RTKApi, callController } from '@/apiConnection'

const initialState = {
  pending: false,
  error: false,
  data: {},
  query: undefined,
  updating: false,
  customPopulationFlag: false,
}

export const getPopulationStatistics = ({
  semesters,
  studentStatuses,
  studyRights,
  months,
  uuid,
  year,
  years,
  onProgress,
}) => {
  const route = '/v3/populationstatistics/'
  const prefix = 'GET_POPULATION_STATISTICS_'
  const query = {
    semesters,
    studentStatuses,
    studyRights,
    uuid,
    months,
    year,
    years,
  }
  const params = {
    semesters,
    studentStatuses,
    months,
    studyRights,
    year,
    years,
  }
  return callController(route, prefix, null, 'get', query, params, onProgress)
}

const populationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCustomPopulation: builder.query({
      query: ({ studentNumbers, tags }) => ({
        url: '/v3/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: {
          studentnumberlist: studentNumbers,
          tags,
        },
      }),
    }),
    getPopulationStatisticsByCourse: builder.query({
      query: ({ coursecodes, from, to, separate, unifyCourses }) => ({
        url: '/v3/populationstatisticsbycourse',
        params: { coursecodes, from, to, separate, unifyCourses },
      }),
    }),
    getMaxYearsToCreatePopulationFrom: builder.query({
      query: ({ courseCodes }) => ({
        url: '/v3/populationstatistics/maxYearsToCreatePopulationFrom',
        params: { courseCodes },
      }),
    }),
    getUnfilteredProgrammes: builder.query({
      query: () => '/v3/populationstatistics/studyprogrammes/unfiltered',
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetCustomPopulationQuery,
  useGetPopulationStatisticsByCourseQuery,
  useGetMaxYearsToCreatePopulationFromQuery,
  useGetUnfilteredProgrammesQuery,
} = populationApi

export const clearPopulations = () => ({
  type: 'CLEAR_POPULATIONS',
})

export const removePopulation = uuid => ({
  type: 'REMOVE_POPULATION',
  uuid,
})

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_STATISTICS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        data: {},
        query: action.requestSettings.query,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_POPULATION_STATISTICS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: action.response,
        query: action.query,
        updating: false,
        customPopulationFlag: false,
      }
    case 'GET_POPULATION_STATISTICS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response,
        query: action.query,
        updating: false,
        customPopulationFlag: false,
      }
    case 'UPDATE_POPULATION_STUDENTS_ATTEMPT':
      return {
        ...state,
        updating: true,
      }
    case 'UPDATE_POPULATION_STUDENTS_FAILURE':
      return {
        ...state,
        updating: false,
      }
    case 'UPDATE_POPULATION_STUDENTS_SUCCESS':
      return {
        ...state,
        updating: false,
      }
    case 'REMOVE_POPULATION':
      return initialState
    case 'CLEAR_POPULATIONS':
      return initialState
    default:
      return state
  }
}
