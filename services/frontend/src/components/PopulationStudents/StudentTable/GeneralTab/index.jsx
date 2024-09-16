import { chain } from 'lodash'
import { useSelector } from 'react-redux'
import { Tab } from 'semantic-ui-react'

import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { useGetStudyGuidanceGroupPopulationQuery } from '@/redux/studyGuidanceGroups'
import { GeneralTab } from './GeneralTab'

// The study guidance groups feature uses different population + rtk query, so it needs to
// be rendered differently. TODO: should refactor this, maybe with using allStudents
// from useFilters and making sure that it contains same students than the population
// backend returns with population query below (so caching works)
const StudyGuidanceGroupGeneralTabContainer = ({ group, ...props }) => {
  // Sorting is needed for RTK query cache to work properly
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber).sort() || []
  const populations = useGetStudyGuidanceGroupPopulationQuery({
    studentnumberlist: groupStudentNumbers,
    tags: {
      studyProgramme: group?.tags?.studyProgramme,
    },
  })
  return <GeneralTab group={group} populations={populations} {...props} />
}

const CustomPopulationGeneralTabContainer = props => {
  const { filteredStudents, customPopulationProgramme } = props
  const populations = useGetCustomPopulationQuery({
    studentNumbers: filteredStudents.map(student => student.studentNumber),
    tags: { studyProgramme: customPopulationProgramme },
  })
  return <GeneralTab populations={populations} {...props} />
}

export const GeneralTabContainer = ({ studyGuidanceGroup, variant, ...props }) => {
  const populations = useSelector(({ populations }) => populations)
  const { namesVisible } = useSelector(({ settings }) => settings)
  const { isAdmin } = useGetAuthorizedUserQuery()

  const getStudyGuidanceGroupColumns = () => {
    const columns = ['credits.since', 'programme', 'startYear']
    if (studyGuidanceGroup?.tags?.studyProgramme)
      columns.push(
        'citizenship',
        'credits.hops',
        'curriculumPeriod',
        'endDate',
        'extent',
        'gender',
        'latestAttainmentDate',
        'priority',
        'semesterEnrollments',
        'semesterEnrollmentsAmount',
        'semesterEnrollmentsForExcel'
      )
    if (studyGuidanceGroup?.tags?.studyProgramme && studyGuidanceGroup?.tags?.year) {
      columns.push('admissionType', 'studyrightStart', 'studyStartDate', 'studyTrack', 'transferredFrom')
    }
    return columns
  }

  const getCustomPopulationColumns = () => {
    const columns = ['programme', 'startYear']
    if (props.customPopulationProgramme) {
      columns.push(
        'credits.hops',
        'credits.studyright',
        'endDate',
        'semesterEnrollments',
        'semesterEnrollmentsAmount',
        'semesterEnrollmentsForExcel',
        'studyrightStart',
        'studyStartDate'
      )
    }
    return columns
  }

  const columnsByVariant = {
    customPopulation: getCustomPopulationColumns(),
    coursePopulation: ['enrollmentDate', 'gradeForSingleCourse', 'language', 'passDate', 'programme', 'startYear'],
    population: [
      'admissionType',
      'citizenship',
      'credits.hops',
      'credits.studyright',
      'curriculumPeriod',
      'endDate',
      'extent',
      'gender',
      'latestAttainmentDate',
      'priority',
      'programme',
      'semesterEnrollments',
      'semesterEnrollmentsAmount',
      'semesterEnrollmentsForExcel',
      'startYear',
      'studyrightStart',
      'studyStartDate',
      'studyTrack',
      'transferredFrom',
    ],
    studyGuidanceGroupPopulation: getStudyGuidanceGroupColumns(),
  }
  const studyGuidanceGroupCombinedProgramme =
    studyGuidanceGroup?.tags?.studyProgramme && studyGuidanceGroup?.tags?.studyProgramme.includes('+')

  if (
    (populations?.query?.studyRights?.combinedProgramme && variant === 'population') ||
    (studyGuidanceGroupCombinedProgramme && variant === 'studyGuidanceGroupPopulation')
  )
    columnsByVariant[variant].push('credits.hopsCombinedProg', 'endDateCombinedProg')
  const baseColumns = ['credits', 'credits.all', 'studentnumber', 'tags', 'updatedAt', 'phoneNumber']
  if (!populations?.query?.studyRights?.combinedProgramme) baseColumns.push('option')
  const nameColumnsToAdd = namesVisible ? ['email', 'lastname', 'firstname'] : []
  const adminColumnsToFilter = isAdmin ? [] : ['priority', 'extent', 'updatedAt']

  const columnKeysToInclude = chain(baseColumns)
    .union(columnsByVariant[variant])
    .union(nameColumnsToAdd)
    .difference(adminColumnsToFilter)
    .value()

  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <Tab.Pane>
        <StudyGuidanceGroupGeneralTabContainer
          columnKeysToInclude={columnKeysToInclude}
          group={studyGuidanceGroup}
          {...props}
        />
      </Tab.Pane>
    )
  }

  if (variant === 'customPopulation' || variant === 'coursePopulation') {
    return (
      <Tab.Pane>
        <CustomPopulationGeneralTabContainer
          columnKeysToInclude={columnKeysToInclude}
          group={studyGuidanceGroup}
          {...props}
        />
      </Tab.Pane>
    )
  }

  return (
    <Tab.Pane>
      <GeneralTab columnKeysToInclude={columnKeysToInclude} populations={populations} {...props} />
    </Tab.Pane>
  )
}
