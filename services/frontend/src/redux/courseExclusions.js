import { RTKApi } from '../apiConnection/index'

const courseExclusionsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    setCourseExclusion: builder.mutation({
      query: ({ programmeCode, courseCodes, curriculumVersion }) => ({
        url: `/v3/course_exclusions/${programmeCode}`,
        method: 'POST',
        body: {
          courseCodes,
          curriculumVersion,
        },
      }),
    }),
    removeCourseExclusion: builder.mutation({
      query: ({ programmeCode, courseCodes, curriculumVersion }) => ({
        url: `/v3/course_exclusions/${programmeCode}`,
        method: 'DELETE',
        body: { courseCodes, curriculumVersion },
      }),
    }),
    overrideExisting: false,
  }),
})

export const { useSetCourseExclusionMutation, useRemoveCourseExclusionMutation } = courseExclusionsApi
