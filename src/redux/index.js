import { combineReducers } from 'redux'
import { localeReducer as locale } from 'react-localize-redux'

import department from './department'
import users from './users'
import populations from './populations'
import populationCourses from './populationCourses'
import populationFilters from './populationFilters'
import populationDegreesAndProgrammes from './populationDegreesAndProgrammes'
import units from './units'
import students from './students'
import errors from './errors'
import courses from './courses'
import courseInstances from './courseInstances'
import courseStatistics from './courseStatistics'
import graphSpinner from './graphSpinner'
import settings from './settings'
import courseCodeDuplicates from './coursecodeduplicates'

export default combineReducers({
  locale,
  department,
  users,
  populations,
  populationCourses,
  populationFilters,
  populationDegreesAndProgrammes,
  units,
  students,
  errors,
  courses,
  courseInstances,
  courseStatistics,
  graphSpinner,
  settings,
  courseCodeDuplicates
})
