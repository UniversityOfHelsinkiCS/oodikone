import React from 'react'
import { Tab } from 'semantic-ui-react'

import { ColorizedCoursesTable } from 'components/ColorizedCoursesTable'
import { useGetColorizedTableCourseStatsQuery } from 'redux/studyProgramme'
import { OverallStatsTable } from './OverallStatsTable'
import { Toggle } from '../Toggle'

export const CourseTabs = ({ data, studyProgramme, showStudents, handleShowStudentsChange }) => {
  const paneTypes = [
    {
      label: 'By credit type',
      icon: 'list',
      component: () => (
        <>
          <Toggle
            cypress="creditsStudentsToggle"
            toolTips={null}
            firstLabel="Show credits"
            secondLabel="Show students"
            value={showStudents}
            setValue={handleShowStudentsChange}
          />
          <OverallStatsTable data={data} showStudents={showStudents} />
        </>
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

  return <Tab id="CourseStatPanes" panes={panes} data-cy="CourseTabs" />
}
