import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { handleRequest, handleAuth, RTKApi } from '../apiConnection'
import actionHistory from './actionHistory'
import users from './users'
import populations from './populations'
import populationCourses from './populationCourses'
import populationSelectedStudentCourses from './populationSelectedStudentCourses'
import populationProgrammes from './populationProgrammes'
import populationProgrammesUnfiltered from './populationProgrammesUnfiltered'
import populationMandatoryCourses from './populationMandatoryCourses'
import studyProgrammeProductivity from './productivity'
import studyProgrammeThroughput from './throughput'
import studyProgrammeBachelors from './studyProgrammeBachelors'
import faculties from './faculties'
import units from './units'
import elementdetails from './elementdetails'
import students from './students'
import errors from './errors'
import courses from './courses'
import courseInstances from './courseInstances'
import graphSpinner from './graphSpinner'
import settings from './settings'
import teachers from './teachers'
import providers from './providers'
import semesters from './semesters'
import teacherStatistics from './teacherStatistics'
import teachersTop from './teachersTop'
import teachersTopCategories from './teachersTopCategories'
import courseSearch from './coursesearch'
import courseStats from './coursestats'
import courseSummaryForm from './coursesSummaryForm'
import thesisCourses from './thesisCourses'
import accessGroups from './accessGroups'
import feedback from './feedback'
import mandatoryCourseLabels from './mandatoryCourseLabels'
import tags from './tags'
import tagstudent from './tagstudent'
import auth from './auth'
import singleCourseStats from './singleCourseStats'
import userAccessEmail from './userAccessEmail'
import customPopulationSearch from './customPopulationSearch'
import coolDataScience from './coolDataScience'

const store = configureStore({
  reducer: {
    actionHistory,
    users,
    mandatoryCourseLabels,
    populations,
    populationCourses,
    populationSelectedStudentCourses,
    populationProgrammes,
    populationProgrammesUnfiltered,
    populationMandatoryCourses,
    studyProgrammeProductivity,
    studyProgrammeThroughput,
    studyProgrammeBachelors,
    faculties,
    units,
    students,
    errors,
    courses,
    courseInstances,
    graphSpinner,
    settings,
    teachers,
    providers,
    semesters,
    teacherStatistics,
    teachersTop,
    teachersTopCategories,
    courseSearch,
    courseStats,
    courseSummaryForm,
    thesisCourses,
    accessGroups,
    elementdetails,
    feedback,
    tags,
    tagstudent,
    auth,
    singleCourseStats,
    userAccessEmail,
    customPopulationSearch,
    coolDataScience,
    [RTKApi.reducerPath]: RTKApi.reducer,
  },
  // oodikone is currently too heavy for other middlewares than thunk, but
  // feel free to take use them at some point if possible
  middleware: getDefaultMiddleware => [
    ...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
    handleRequest,
    handleAuth,
    RTKApi.middleware,
  ],
})
setupListeners(store.dispatch)
export default store
