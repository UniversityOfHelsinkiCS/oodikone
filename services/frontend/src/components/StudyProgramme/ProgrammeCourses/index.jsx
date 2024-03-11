import React from 'react'
import { Tab } from 'semantic-ui-react'

import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useGetColorizedTableCourseStatsQuery } from '@/redux/studyProgramme'
import { OverallStatsTable } from './OverallStatsTable'

export const ProgrammeCourses = ({ studyProgramme, combinedProgramme, academicYear, setAcademicYear }) => {
  const paneTypes = [
    {
      label: 'By credit type',
      icon: 'list',
      component: () => (
        <OverallStatsTable
          academicYear={academicYear}
          combinedProgramme={combinedProgramme}
          setAcademicYear={setAcademicYear}
          studyProgramme={studyProgramme}
        />
      ),
    },
    {
      label: 'By semester',
      icon: 'calendar',
      component: () => (
        <ColorizedCoursesTable
          fetchDataHook={useGetColorizedTableCourseStatsQuery}
          panes={['Semesters']}
          studyProgramme={studyProgramme}
        />
      ),
    },
  ]

  const panes = paneTypes.map(({ icon, label, component: Component }) => ({
    menuItem: { icon, content: label, key: label },
    render: () => (
      <Tab.Pane>
        <Component />
      </Tab.Pane>
    ),
  }))

  return (
    <div className="studyprogramme-courses">
      <Tab data-cy="CourseTabs" id="CourseStatPanes" panes={panes} />
    </div>
  )
}
