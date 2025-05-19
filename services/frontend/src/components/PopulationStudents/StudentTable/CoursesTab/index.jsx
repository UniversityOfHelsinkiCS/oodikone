import { Tab } from 'semantic-ui-react'
import { useAppSelector } from '@/redux/hooks'

import { useGetStudyGuidanceGroupPopulationCoursesQuery } from '@/redux/studyGuidanceGroups'

import { CoursesTable } from './CoursesTable'

export const CoursesTabContainer = ({ curriculum, includeSubstitutions, students, studyGuidanceGroup, variant }) => {
  const { data: studyGuidanceGroupPopulationsCourses, isLoading } = useGetStudyGuidanceGroupPopulationCoursesQuery({
    studentnumberlist: students.map(student => student.studentNumber).sort(),
    year: studyGuidanceGroup?.tags?.year,
  })

  const { data: populationCourses } = useAppSelector(state => state.populationSelectedStudentCourses)

  const studyGuidanceGroupLoading = isLoading || !curriculum || !students
  const loading = !curriculum || !students || !populationCourses

  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <Tab.Pane loading={studyGuidanceGroupLoading}>
        {!studyGuidanceGroupLoading && (
          <CoursesTable
            curriculum={curriculum}
            includeSubstitutions={includeSubstitutions}
            populationCourses={studyGuidanceGroupPopulationsCourses}
            students={students}
          />
        )}
      </Tab.Pane>
    )
  }

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
