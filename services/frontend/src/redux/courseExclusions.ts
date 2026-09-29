import { RTKApi } from '@/apiConnection'

import type { ExcludedCoursesResBody, ExcludedCoursesReqBody } from '@oodikone/shared/routes/courseExclusions'

const courseExclusionsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    setCourseExclusion: builder.mutation<ExcludedCoursesResBody, ExcludedCoursesReqBody>({
      query: ({ courseGroupIds, curriculumVersion, programmeCode }) => ({
        url: `/course-exclusions/`,
        method: 'POST',
        body: { courseGroupIds, curriculumVersion, programmeCode },
      }),
    }),
    removeCourseExclusion: builder.mutation<ExcludedCoursesResBody, ExcludedCoursesReqBody>({
      query: ({ courseGroupIds, curriculumVersion, programmeCode }) => ({
        url: `/course-exclusions/`,
        method: 'DELETE',
        body: { courseGroupIds, curriculumVersion, programmeCode },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useSetCourseExclusionMutation, useRemoveCourseExclusionMutation } = courseExclusionsApi
