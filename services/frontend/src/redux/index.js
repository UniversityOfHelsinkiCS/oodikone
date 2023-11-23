import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { handleRequest, RTKApi } from 'apiConnection'
import actionHistory from './actionHistory'
import users from './users'
import populations from './populations'
import { curriculumsApi } from './populationCourses'
import populationSelectedStudentCourses from './populationSelectedStudentCourses'
import populationProgrammes from './populationProgrammes'
import populationProgrammesUnfiltered from './populationProgrammesUnfiltered'
import faculties from './faculties'
import units from './units'
import students from './students'
import settings from './settings'
import teachers from './teachers'
import providers from './providers'
import teacherStatistics from './teacherStatistics'
import teachersTop from './teachersTop'
import teachersTopCategories from './teachersTopCategories'
import courseSearch from './coursesearch'
import courseStats from './coursestats'
import courseSummaryForm from './coursesSummaryForm'
import accessGroups from './accessGroups'
import tags from './tags'
import tagstudent from './tagstudent'
import singleCourseStats from './singleCourseStats'
import userAccessEmail from './userAccessEmail'
import coolDataScience from './coolDataScience'
import filters from './filters'

const store = configureStore({
  reducer: {
    actionHistory,
    users,
    populations,
    populationSelectedStudentCourses,
    populationProgrammes,
    populationProgrammesUnfiltered,
    faculties,
    units,
    students,
    settings,
    teachers,
    providers,
    teacherStatistics,
    teachersTop,
    teachersTopCategories,
    courseSearch,
    courseStats,
    courseSummaryForm,
    accessGroups,
    tags,
    tagstudent,
    singleCourseStats,
    userAccessEmail,
    coolDataScience,
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
export default store
