import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

export const useColumns = (): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  const excelOnlyColumns = ['email', 'phoneNumber']

  return [
    [
      'studentNumber',
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
    excelOnlyColumns,
  ]
}
