import { RTKApi } from '@/apiConnection'

const populationCoursesApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getPopulationSelectedStudentCourses: builder.query({
      query: ({ selectedStudents, selectedStudentsByYear, courses }) => ({
        url: '/v4/populationstatistics/courses',
        method: 'POST',
        body: { selectedStudents, selectedStudentsByYear, courses },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useGetPopulationSelectedStudentCoursesQuery } = populationCoursesApi

// TODO: This was used in the PopulationSearchForm
// export const clearSelected = () => populationCoursesApi.util.resetApiState()
