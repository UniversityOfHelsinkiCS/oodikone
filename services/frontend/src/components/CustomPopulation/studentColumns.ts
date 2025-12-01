import { useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

export const useColumns = ({ programme }): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const populationWithProgrammeColumns = programme
    ? ['option', 'transferredFrom', 'semesterEnrollments', 'curriculumPeriod']
    : ['primaryProgramme']

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  /* REQUIRED TO ALWAYS BE VISIBLE */
  const excelRequired = ['studentNumber', 'lastName', 'firstNames', 'email', 'secondaryEmail', 'phoneNumber']

  return [
    [
      'studentNumber',
      'programmes',
      'creditsTotal',
      'creditsHops',
      'creditsSince',
      'admissionType',
      'startYearAtUniversity',
      'graduationDate',
      'studyRightStart',
      'programmeStart',
      'programmeStatus',
      'studyTrack',
      'gender',
      'citizenships',
      'mostRecentAttainment',
      'tvex',
      'tags',
      ...nameColumns,
      ...populationWithProgrammeColumns,
      ...adminColumns,
    ],
    excelRequired,
  ]
}
