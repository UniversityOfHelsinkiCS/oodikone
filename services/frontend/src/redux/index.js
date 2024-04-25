import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'

import { handleRequest, RTKApi } from '@/apiConnection'
import { reducer as actionHistory } from './actionHistory'
import { reducer as courseSearch } from './coursesearch'
import { coursesSummaryFormReducer as courseSummaryForm } from './coursesSummaryForm'
import { reducer as courseStats } from './coursestats'
import { reducer as filters } from './filters'
import { reducer as populationProgrammes } from './populationProgrammes'
import { reducer as populations } from './populations'
import { reducer as populationSelectedStudentCourses } from './populationSelectedStudentCourses'
import { reducer as settings } from './settings'
import { reducer as singleCourseStats } from './singleCourseStats'
import { reducer as students } from './students'
import { reducer as tags } from './tags'
import { reducer as tagstudent } from './tagstudent'

export const store = configureStore({
  reducer: {
    actionHistory,
    populations,
    populationSelectedStudentCourses,
    populationProgrammes,
    students,
    settings,
    courseSearch,
    courseStats,
    courseSummaryForm,
    tags,
    tagstudent,
    singleCourseStats,
    [RTKApi.reducerPath]: RTKApi.reducer,
    filters,
  },
  // oodikone is currently too heavy for other middlewares than thunk, but
  // feel free to take use them at some point if possible
  middleware: getDefaultMiddleware => [
    ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
    RTKApi.middleware,
    handleRequest,
  ],
})
setupListeners(store.dispatch)
