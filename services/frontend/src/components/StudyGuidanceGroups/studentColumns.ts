import { useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

import type { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'

export const useColumns = ({ group }: { group: GroupsWithTags }): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const [programme, combinedProgramme] = group?.tags?.studyProgramme?.split('+') ?? []
  const year = group?.tags?.year

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const groupWithProgrammeColumns = programme
    ? [
        'citizenships',
        'programmeStatus',
        'creditsHops',
        'curriculumPeriod',
        'graduationDate',
        'gender',
        'mostRecentAttainment',
        'semesterEnrollments',
      ]
    : []

  const groupWithCombinedProgrammeColumns =
    !!programme && !!combinedProgramme ? ['graduationDateCombinedProg', 'creditsCombinedProg'] : []

  const groupWithYearColumns =
    !!programme && !!year ? ['admissionType', 'studyRightStart', 'programmeStart', 'studyTrack', 'transferredFrom'] : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  /* REQUIRED TO ALWAYS BE VISIBLE */
  const excelRequired = ['studentNumber', 'lastName', 'firstNames', 'email', 'phoneNumber']

  return [
    [
      ...nameColumns,
      'studentNumber',
      'programmes',
      'creditsTotal',
      'creditsSince',
      'startYearAtUniversity',
      'tvex',
      'tags',
      ...groupWithProgrammeColumns,
      ...groupWithCombinedProgrammeColumns,
      ...groupWithYearColumns,
      ...adminColumns,
    ],
    excelRequired,
  ]
}
