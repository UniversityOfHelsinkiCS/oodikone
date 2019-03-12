import { combineReducers } from 'redux'
import { localeReducer as locale } from 'react-localize-redux'

import department from './department'
import users from './users'
import populations from './populations'
import populationCourses from './populationCourses'
import populationFilters from './populationFilters'
import populationDegreesAndProgrammes from './populationDegreesAndProgrammes'
import populationDegreesAndProgrammesUnfiltered from './populationDegreesAndProgrammesUnfiltered'
import populationMandatoryCourses from './populationMandatoryCourses'
import studyProgrammeProductivity from './productivity'
import units from './units'
import students from './students'
import errors from './errors'
import courses from './courses'
import courseInstances from './courseInstances'
import courseStatistics from './courseStatistics'
import graphSpinner from './graphSpinner'
import settings from './settings'
import courseCodeDuplicates from './coursecodeduplicates'
import teachers from './teachers'
import providers from './providers'
import semesters from './semesters'
import teacherStatistics from './teacherStatistics'
import teachersTop from './teachersTop'
import teachersTopCategories from './teachersTopCategories'
import courseTypes from './coursetypes'
import courseDisciplines from './coursedisciplines'
import courseSearch from './coursesearch'
import courseStats from './coursestats'
import courseSummaryForm from './coursesSummaryForm'
import sandbox from './sandbox'
import ping from './ping'
import oodilearnStudent from './oodilearnStudent'
import oodilearnCourses from './oodilearnCourses'
import oodilearnCourse from './oodilearnCourse'
import oodilearnCluster from './oodilearnCluster'
import oodilearnPopulations from './oodilearnPopulations'
import oodilearnPopulation from './oodilearnPopulation'
import oodilearnPopulationForm from './oodilearnPopulationForm'
import oodilearnPopulationCourseSelect from './oodilearnPopulationCourseSelect'

export default combineReducers({
  locale,
  department,
  users,
  populations,
  populationCourses,
  populationFilters,
  populationDegreesAndProgrammes,
  populationDegreesAndProgrammesUnfiltered,
  populationMandatoryCourses,
  studyProgrammeProductivity,
  units,
  students,
  errors,
  courses,
  courseInstances,
  courseStatistics,
  graphSpinner,
  settings,
  courseCodeDuplicates,
  teachers,
  providers,
  semesters,
  teacherStatistics,
  teachersTop,
  teachersTopCategories,
  courseTypes,
  courseDisciplines,
  courseSearch,
  courseStats,
  courseSummaryForm,
  sandbox,
  ping,
  oodilearnStudent,
  oodilearnCourses,
  oodilearnCourse,
  oodilearnCluster,
  oodilearnPopulations,
  oodilearnPopulation,
  oodilearnPopulationForm,
  oodilearnPopulationCourseSelect
})
