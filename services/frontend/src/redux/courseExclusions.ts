import { RTKApi } from '@/apiConnection'

import type { ExcludedCoursesResBody, ExcludedCoursesReqBody } from '@oodikone/shared/routes/courseExclusions'

const courseExclusionsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    setCourseExclusion: builder.mutation<ExcludedCoursesResBody, ExcludedCoursesReqBody>({
      query: ({ courseCodes, curriculumVersion, programmeCode }) => ({
        url: `/v3/course-exclusions/`,
        method: 'POST',
        body: { courseCodes, curriculumVersion, programmeCode },
      }),
    }),
    removeCourseExclusion: builder.mutation<ExcludedCoursesResBody, ExcludedCoursesReqBody>({
      query: ({ courseCodes, curriculumVersion, programmeCode }) => ({
        url: `/v3/course-exclusions/`,
        method: 'DELETE',
        body: { courseCodes, curriculumVersion, programmeCode },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useSetCourseExclusionMutation, useRemoveCourseExclusionMutation } = courseExclusionsApi
