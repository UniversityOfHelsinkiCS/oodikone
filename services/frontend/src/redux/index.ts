import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'

import { handleRequest, RTKApi } from '@/apiConnection'
import { reducer as actionHistory } from './actionHistory'
import { reducer as courseSearch } from './courseSearch'
import { reducer as courseSummaryForm } from './coursesSummaryForm'
import { reducer as courseStats } from './courseStats'
import { reducer as filters } from './filters'
import { reducer as populations } from './populations'
import { reducer as populationSelectedStudentCourses } from './populationSelectedStudentCourses'
import { reducer as selectedCourse } from './selectedCourse'
import { reducer as settings } from './settings'

export const store = configureStore({
  reducer: {
    actionHistory,
    courseSearch,
    courseStats,
    courseSummaryForm,
    filters,
    populations,
    populationSelectedStudentCourses,
    selectedCourse,
    settings,
    [RTKApi.reducerPath]: RTKApi.reducer,
  },
  // oodikone is currently too heavy for other middlewares than thunk, but
  // feel free to take use them at some point if possible
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }).concat(RTKApi.middleware, handleRequest),
})
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
// eslint-disable-next-line import/no-unused-modules
export type AppDispatch = typeof store.dispatch
