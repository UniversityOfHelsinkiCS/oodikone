import { Tab } from 'semantic-ui-react'

import { useGetPopulationCourseStatisticsQuery } from '@/redux/populationCourses'
import { CoursesTable } from './CoursesTable'

export const CoursesTabContainer = ({ curriculum, includeSubstitutions, students }) => {
  const { data: populationCourses, isFetching } = useGetPopulationCourseStatisticsQuery({
    selectedStudents: students.map(({ studentNumber }) => studentNumber),
  })

  const loading = isFetching || !curriculum || !students || !populationCourses

  return (
    <Tab.Pane loading={loading}>
      {!loading && (
        <CoursesTable
          curriculum={curriculum}
          includeSubstitutions={includeSubstitutions}
          populationCourses={populationCourses}
          students={students}
        />
      )}
    </Tab.Pane>
  )
}
