import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useGetColorizedTableCourseStatsQuery } from '@/redux/studyProgramme'

export const BySemesterTab = ({ studyProgramme }) => {
  return (
    <ColorizedCoursesTable
      fetchDataHook={useGetColorizedTableCourseStatsQuery}
      panes={['Semesters']}
      studyProgramme={studyProgramme}
    />
  )
}
