import { CoursesTable } from './CoursesTable'

export const CoursesTabContainer = ({ curriculum, includeSubstitutions, students, courses }) => {
  const loading = !curriculum || !students || !courses

  if (loading) return null

  return (
    <CoursesTable
      curriculum={curriculum}
      includeSubstitutions={includeSubstitutions}
      populationCourses={courses}
      students={students}
    />
  )
}
