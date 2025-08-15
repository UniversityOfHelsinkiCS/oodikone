import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

export const useColumns = ({ showCombinedProgrammeColumns }): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const combinedProgrammeColumns = showCombinedProgrammeColumns
    ? ['graduationDateCombinedProg', 'creditsCombinedProg']
    : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  const excelOnlyColumns = ['email', 'phoneNumber']

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
      ...adminColumns,
    ],
    excelOnlyColumns,
  ]
}
