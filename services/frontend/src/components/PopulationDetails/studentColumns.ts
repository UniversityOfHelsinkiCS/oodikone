import { useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

export const useColumns = ({ showCombinedProgrammeColumns, isMastersProgramme }): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const combinedProgrammeColumns = showCombinedProgrammeColumns
    ? ['graduationDateCombinedProg', 'creditsCombinedProg']
    : []

  const mastersProgrammeColumns = isMastersProgramme ? ['studyTimeMonths'] : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  /* REQUIRED TO ALWAYS BE VISIBLE */
  const excelRequired = ['studentNumber', 'lastName', 'firstNames', 'email', 'secondaryEmail', 'phoneNumber']

  return [
    [
      ...nameColumns,
      'studentNumber',
      'programmes',
      'creditsTotal',
      'creditsHops',
      'creditsSince',
      'studyTrack',
      'studyRightStart',
      'programmeStart',
      'programmeStatus',
      'option',
      'semesterEnrollments',
      'graduationDate',
      'startYearAtUniversity',
      'transferredFrom',
      'admissionType',
      'gender',
      'citizenships',
      'curriculumPeriod',
      'mostRecentAttainment',
      'tvex',
      'tags',
      ...combinedProgrammeColumns,
      ...mastersProgrammeColumns,
      ...adminColumns,
    ],
    excelRequired,
  ]
}
