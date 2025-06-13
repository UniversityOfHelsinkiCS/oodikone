import { Tab } from 'semantic-ui-react'

import { CoursesTable } from './CoursesTable'

export const CoursesTabContainer = ({ curriculum, includeSubstitutions, students, courses }) => {
  const loading = !curriculum || !students || !courses

  return (
    <Tab.Pane loading={loading}>
      {!loading && (
        <CoursesTable
          curriculum={curriculum}
          includeSubstitutions={includeSubstitutions}
          populationCourses={courses}
          students={students}
        />
      )}
    </Tab.Pane>
  )
}
