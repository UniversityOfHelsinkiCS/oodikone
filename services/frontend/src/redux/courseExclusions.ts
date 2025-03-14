import { RTKApi } from '@/apiConnection'

type CourseExclusionRequestParams = { courseCodes: string[]; curriculumVersion: string; programmeCode: string }

const courseExclusionsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    setCourseExclusion: builder.mutation<void, CourseExclusionRequestParams>({
      query: ({ courseCodes, curriculumVersion, programmeCode }) => ({
        url: `/v3/course-exclusions/${programmeCode}`,
        method: 'POST',
        body: { courseCodes, curriculumVersion },
      }),
    }),
    removeCourseExclusion: builder.mutation<void, CourseExclusionRequestParams>({
      query: ({ courseCodes, curriculumVersion, programmeCode }) => ({
        url: `/v3/course-exclusions/${programmeCode}`,
        method: 'DELETE',
        body: { courseCodes, curriculumVersion },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useSetCourseExclusionMutation, useRemoveCourseExclusionMutation } = courseExclusionsApi
