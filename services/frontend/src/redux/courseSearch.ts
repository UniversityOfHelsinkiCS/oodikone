import { createSlice } from '@reduxjs/toolkit'

import { RTKApi } from '@/apiConnection'
import { GetCourseSearchResultRequest, GetCourseSearchResultResponse } from '@/types/api/courses'

const courseSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseSearchResult: builder.query<GetCourseSearchResultResponse, GetCourseSearchResultRequest>({
      query: ({ name, code, combineSubstitutions }) => ({
        url: '/v2/coursesmulti',
        params: { name, code, combineSubstitutions },
      }),
    }),
  }),
})

export const { useGetCourseSearchResultQuery } = courseSearchApi

export type CourseSearchState = 'openStats' | 'regularStats' | 'unifyStats'
const initialState: { openOrRegular: CourseSearchState } = { openOrRegular: 'unifyStats' }

const courseSearchSlice = createSlice({
  name: 'courseSearch',
  initialState,
  reducers: {
    toggleOpenAndRegularCourses: (state, { payload }) => {
      if (!['openStats', 'regularStats', 'unifyStats'].includes(payload)) {
        throw new Error(`Invalid payload ${payload} for toggleOpenAndRegularCourses`)
      }
      state.openOrRegular = payload
    },
  },
})

export const { toggleOpenAndRegularCourses } = courseSearchSlice.actions

export const { reducer } = courseSearchSlice
