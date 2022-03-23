/* eslint-disable import/prefer-default-export */

import { RTKApi } from 'apiConnection'

const semestersApi = RTKApi.injectEndpoints({
  tagTypes: ['Semester'],
  endpoints: builder => ({
    getSemesters: builder.query({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetSemestersQuery } = semestersApi
