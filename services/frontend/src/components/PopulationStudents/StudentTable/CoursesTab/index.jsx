import { useSelector } from 'react-redux'
import { Tab } from 'semantic-ui-react'

import { useGetStudyGuidanceGroupPopulationCoursesQuery } from '@/redux/studyGuidanceGroups'

import { CoursesTable } from './CoursesTable'

export const CoursesTabContainer = ({ curriculum, includeSubstitutions, students, studyGuidanceGroup, variant }) => {
  const { data: studyGuidanceGroupPopulationsCourses, isLoading: coursesAreLoading } =
    useGetStudyGuidanceGroupPopulationCoursesQuery({
      studentnumberlist: students.map(student => student.studentNumber).sort(),
      year: studyGuidanceGroup?.tags?.year,
    })

  const { data: populationCourses, pending } = useSelector(state => state?.populationSelectedStudentCourses)

  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <Tab.Pane loading={coursesAreLoading || !curriculum}>
        <CoursesTable
          curriculum={curriculum}
          includeSubstitutions={includeSubstitutions}
          populationCourses={studyGuidanceGroupPopulationsCourses}
          students={students}
        />
      </Tab.Pane>
    )
  }

  return (
    <Tab.Pane loading={pending || !curriculum}>
      <CoursesTable
        curriculum={curriculum}
        includeSubstitutions={includeSubstitutions}
        populationCourses={populationCourses}
        students={students}
      />
    </Tab.Pane>
  )
}
