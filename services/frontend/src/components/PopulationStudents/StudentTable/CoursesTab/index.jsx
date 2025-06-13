import { Tab } from 'semantic-ui-react'

import { useGetStudyGuidanceGroupPopulationCoursesQuery } from '@/redux/studyGuidanceGroups'
import { CoursesTable } from './CoursesTable'

export const CoursesTabContainer = ({ curriculum, includeSubstitutions, students }) => {
  const { data: populationCourses, isFetching } = useGetStudyGuidanceGroupPopulationCoursesQuery({
    studentnumberlist: students.map(({ studentNumber }) => studentNumber),
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
