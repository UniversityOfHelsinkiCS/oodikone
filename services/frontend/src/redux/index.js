import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { handleRequest, RTKApi } from 'apiConnection'
import { reducer as actionHistory } from './actionHistory'
import { reducer as users } from './users'
import { reducer as populations } from './populations'
import { curriculumsApi } from './populationCourses'
import { reducer as populationSelectedStudentCourses } from './populationSelectedStudentCourses'
import { reducer as populationProgrammes } from './populationProgrammes'
import { reducer as faculties } from './faculties'
import { reducer as students } from './students'
import { reducer as settings } from './settings'
import { reducer as courseSearch } from './coursesearch'
import { reducer as courseStats } from './coursestats'
import { coursesSummaryFormReducer as courseSummaryForm } from './coursesSummaryForm'
import { reducer as tags } from './tags'
import { reducer as tagstudent } from './tagstudent'
import { reducer as singleCourseStats } from './singleCourseStats'
import { reducer as filters } from './filters'

export const store = configureStore({
  reducer: {
    actionHistory,
    users,
    populations,
    populationSelectedStudentCourses,
    populationProgrammes,
    faculties,
    students,
    settings,
    courseSearch,
    courseStats,
    courseSummaryForm,
    tags,
    tagstudent,
    singleCourseStats,
    [RTKApi.reducerPath]: RTKApi.reducer,
    [curriculumsApi.reducerPath]: curriculumsApi.reducer,
    filters,
  },
  // oodikone is currently too heavy for other middlewares than thunk, but
  // feel free to take use them at some point if possible
  middleware: getDefaultMiddleware => [
    ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }).concat(curriculumsApi.middleware),
    handleRequest,
    RTKApi.middleware,
  ],
})
setupListeners(store.dispatch)
