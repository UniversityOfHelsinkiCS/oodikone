import { RTKApi, callController } from '../apiConnection'

export const getPopulationCourses = ({
  semesters,
  studentStatuses,
  studyRights,
  months,
  uuid,
  selectedStudents,
  selectedStudentsByYear,
  year,
  years,
  tag,
}) => {
  const route = !tag ? '/v2/populationstatistics/courses' : '/v2/populationstatistics/coursesbytag'
  const prefix = 'GET_POPULATION_COURSES_'
  const query = {
    semesters,
    studentStatuses,
    studyRights,
    months,
    uuid,
    selectedStudents,
    year,
    years,
    tag,
    selectedStudentsByYear,
  }

  const body = {
    semesters,
    months,
    studyRights,
    tag,
    year,
    selectedStudentsByYear,
    years,
  }
  return callController(route, prefix, body, 'post', query)
}

const courseStatisticsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentListCourseStatistics: builder.query({
      query: ({ studentNumbers }) => ({
        url: '/v2/populationstatistics/coursesbystudentnumberlist',
        method: 'POST',
        body: {
          studentnumberlist: studentNumbers,
        },
      }),
    }),
  }),
})

export const { useGetStudentListCourseStatisticsQuery } = courseStatisticsApi

export const curriculumsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumOptions: builder.query({
      query: ({ code }) => `/v3/programme_modules/get_curriculum_options/${code}`,
    }),
    getCurriculums: builder.query({
      // eslint-disable-next-line camelcase
      query: ({ code, period_ids }) => `/v3/programme_modules/get_curriculum/${code}/${period_ids.join(',')}`,
    }),
  }),
})

export const getCustomPopulationCoursesByStudentnumbers = ({ studentnumberlist, usingStudyGuidanceGroups }) => {
  const route = '/v2/populationstatistics/coursesbystudentnumberlist'
  const prefix = 'GET_COURSES_OF_CUSTOM_POP_BY_SN_'
  const params = { studentnumberlist, usingStudyGuidanceGroups }
  const query = { studentnumberlist, usingStudyGuidanceGroups }
  const body = { studentnumberlist, usingStudyGuidanceGroups }

  return callController(route, prefix, body, 'post', query, params)
}

const defaultState = { pending: false, error: false, data: {}, query: {} }
const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'GET_POPULATION_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: action.requestSettings.query,
      }
    case 'GET_POPULATION_COURSES_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: {},
        query: action.query,
      }
    case 'GET_POPULATION_COURSES_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response || {},
        query: action.query,
      }
    case 'GET_COURSES_OF_COURSE_POP_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: action.requestSettings.query,
      }
    case 'GET_COURSES_OF_COURSE_POP_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: {},
        query: action.query,
      }
    case 'GET_COURSES_OF_COURSE_POP_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response || {},
        query: action.query,
      }
    case 'GET_COURSES_OF_CUSTOM_POP_BY_SN_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
        query: action.requestSettings.query,
      }
    case 'GET_COURSES_OF_CUSTOM_POP_BY_SN_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        data: {},
        query: action.query,
      }
    case 'GET_COURSES_OF_CUSTOM_POP_BY_SN_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response || {},
        query: action.query,
      }
    default:
      return state
  }
}

export default reducer
