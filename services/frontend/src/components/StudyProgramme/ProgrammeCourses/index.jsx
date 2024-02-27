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
          studyProgramme={studyProgramme}
          combinedProgramme={combinedProgramme}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
        />
      ),
    },
    {
      label: 'By semester',
      icon: 'calendar',
      component: () => (
        <ColorizedCoursesTable
          fetchDataHook={useGetColorizedTableCourseStatsQuery}
          studyProgramme={studyProgramme}
          panes={['Semesters']}
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
      <Tab id="CourseStatPanes" panes={panes} data-cy="CourseTabs" />
    </div>
  )
}
