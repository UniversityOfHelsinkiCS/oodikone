import React from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { useGetStudyGuidanceGroupPopulationQuery } from 'redux/studyGuidanceGroups'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import GeneralTab from './GeneralTab'

// study guidance groups -feature uses different population + rtk query, so it needs to
// be rendered differently. TODO: should refactor this, maybe with using allStudents
// from useFilters and making sure that it contains same students than the population
// backend returns with population query below (so caching works)
const StudyGuidanceGroupGeneralTabContainer = ({ group, ...props }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const { tags } = group
  const populations = useGetStudyGuidanceGroupPopulationQuery({ studentnumberlist: groupStudentNumbers, tags })
  return <GeneralTab populations={populations} group={group} {...props} />
}

const GeneralTabContainer = ({ studyGuidanceGroup, variant, ...props }) => {
  const populations = useSelector(({ populations }) => populations)
  const { namesVisible } = useSelector(({ settings }) => settings)
  const { isAdmin } = useGetAuthorizedUserQuery()

  const getStudyGuidanceGroupColumns = () => {
    const cols = ['credits.since', 'programme', 'startYear']
    if (studyGuidanceGroup?.tags?.studyProgramme)
      cols.push(
        'credits.hops',
        'studyrightStart',
        'studyStartDate',
        'studyStartDateActual',
        'endDate',
        'semesterEnrollments',
        'semesterEnrollmentsAmount'
      )
    if (studyGuidanceGroup?.tags?.studyProgramme && studyGuidanceGroup?.tags?.year) {
      cols.push('admissionType')
    }
    return cols
  }

  const columnsByVariant = {
    customPopulation: ['credits.since', 'programme', 'startYear'],
    coursePopulation: [
      'gradeForSingleCourse',
      'programme',
      'passDate',
      'studyStartDate',
      'enrollmentDate',
      'language',
      'startYear',
    ],
    population: [
      'transferredFrom',
      'credits.hops',
      'credits.studyright',
      'priority',
      'extent',
      'semesterEnrollments',
      'semesterEnrollmentsAmount',
      'studyrightStart',
      'studyStartDate',
      'studyStartDateActual',
      'endDate',
      'studyTrack',
      'admissionType',
    ],
    studyGuidanceGroupPopulation: getStudyGuidanceGroupColumns(),
  }

  if (populations?.query?.studyRights?.combinedProgramme && variant === 'population')
    columnsByVariant[variant].push('credits.hopsCombinedProg', 'endDateCombinedProg')
  const baseColumns = ['credits', 'credits.all', 'studentnumber', 'tags', 'updatedAt', 'phoneNumber']
  if (!populations?.query?.studyRights?.combinedProgramme) baseColumns.push('option')
  const nameColumnsToAdd = namesVisible ? ['email', 'lastname', 'firstname'] : []
  const adminColumnsToFilter = isAdmin ? [] : ['priority', 'extent', 'updatedAt']

  const columnKeysToInclude = _.chain(baseColumns)
    .union(columnsByVariant[variant])
    .union(nameColumnsToAdd)
    .difference(adminColumnsToFilter)
    .value()

  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <StudyGuidanceGroupGeneralTabContainer
        group={studyGuidanceGroup}
        columnKeysToInclude={columnKeysToInclude}
        {...props}
      />
    )
  }

  return <GeneralTab populations={populations} columnKeysToInclude={columnKeysToInclude} {...props} />
}

export default GeneralTabContainer
