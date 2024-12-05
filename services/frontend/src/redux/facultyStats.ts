import { RTKApi } from '@/apiConnection'
import {
  GetFacultiesResponse,
  GetFacultyBasicStatsResponse,
  GetFacultyBasicStatsRequest,
  GetFacultyCreditStatsResponse,
  GetFacultyCreditStatsRequest,
  GetFacultyThesisStatsResponse,
  GetFacultyThesisStatsRequest,
  GetFacultyGraduationTimesResponse,
  GetFacultyGraduationTimesRequest,
  GetAllProgressStatsResponse,
  GetAllProgressStatsRequest,
} from '@/types/api/faculty'
import { GetAllGraduationStatsResponse } from '@/types/api/university'

const facultystatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getFaculties: builder.query<GetFacultiesResponse[], void>({
      query: () => '/faculties',
      keepUnusedDataFor: 24 * 60 * 60, // 24 hours
    }),
    getFacultyBasicStats: builder.query<GetFacultyBasicStatsResponse, GetFacultyBasicStatsRequest>({
      query: ({ id, yearType, studyProgrammeFilter, specialGroups }) =>
        `/faculties/${id}/basicstats?year_type=${yearType}&programme_filter=${studyProgrammeFilter}&special_groups=${specialGroups}`,
    }),
    getFacultyCreditStats: builder.query<GetFacultyCreditStatsResponse, GetFacultyCreditStatsRequest>({
      query: ({ id, yearType }) => `/faculties/${id}/creditstats?year_type=${yearType}`,
    }),
    getFacultyThesisStats: builder.query<GetFacultyThesisStatsResponse, GetFacultyThesisStatsRequest>({
      query: ({ id, yearType, studyProgrammeFilter, specialGroups }) =>
        `/faculties/${id}/thesisstats?year_type=${yearType}&programme_filter=${studyProgrammeFilter}&special_groups=${specialGroups}`,
    }),
    getFacultyGraduationTimes: builder.query<GetFacultyGraduationTimesResponse, GetFacultyGraduationTimesRequest>({
      query: ({ id, studyProgrammeFilter }) =>
        `/faculties/${id}/graduationtimes?programme_filter=${studyProgrammeFilter}`,
    }),
    getFacultyProgressStats: builder.query({
      query: ({ id, specialGroups, graduated }) =>
        `/faculties/${id}/progressstats?special_groups=${specialGroups}&graduated=${graduated}`,
    }),
    getAllFacultiesProgressStats: builder.query<GetAllProgressStatsResponse, GetAllProgressStatsRequest>({
      query: ({ graduated, includeSpecials }) =>
        `/university/allprogressstats?graduated=${graduated}&specialsIncluded=${includeSpecials}`,
    }),
    getAllFacultiesGraduationStats: builder.query<GetAllGraduationStatsResponse, void>({
      query: () => '/university/allgraduationstats',
    }),
    getFacultyStudentStats: builder.query({
      query: ({ id, specialGroups, graduated }) =>
        `/faculties/${id}/studentstats?special_groups=${specialGroups}&graduated=${graduated}`,
    }),
    updateFacultyBasicView: builder.query({
      query: ({ id, statsType }) => `/faculties/${id}/update_basicview?stats_type=${statsType}`,
    }),
    updateFacultyProgressView: builder.query({
      query: ({ id }) => `/faculties/${id}/update_progressview`,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetFacultiesQuery,
  useGetFacultyBasicStatsQuery,
  useGetFacultyCreditStatsQuery,
  useGetFacultyThesisStatsQuery,
  useGetFacultyGraduationTimesQuery,
  useGetFacultyProgressStatsQuery,
  useGetAllFacultiesProgressStatsQuery,
  useGetAllFacultiesGraduationStatsQuery,
  useGetFacultyStudentStatsQuery,
  useUpdateFacultyBasicViewQuery,
  useUpdateFacultyProgressViewQuery,
} = facultystatsApi
