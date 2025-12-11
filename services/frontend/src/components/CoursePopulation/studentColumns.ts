import { useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

export const useColumns = (): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  /* REQUIRED TO ALWAYS BE VISIBLE */
  const excelRequired = ['studentNumber', 'lastName', 'firstNames', 'email', 'secondaryEmail', 'phoneNumber']

  return [
    [
      'studentNumber',
      'associatedProgramme',
      'programmes',
      'creditsTotal',
      'grade',
      'language',
      'attainmentDate',
      'enrollmentDate',
      'startYearAtUniversity',
      'tvex',
      'tags',
      ...nameColumns,
      ...adminColumns,
    ],
    excelRequired,
  ]
}
