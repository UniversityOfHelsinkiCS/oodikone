import React from 'react'
import { Tab } from 'semantic-ui-react'
import OverallStatsTable from './OverallStatsTable'
import Toggle from '../Toggle'

const CourseTabs = ({ data, showStudents, handleShowStudentsChange }) => {
  const paneTypes = [
    {
      label: 'Tables',
      icon: 'table',
      /* initialSettings: { showDetails: false, showEnrollments: false, viewMode: 'STUDENT', separate },
      settings: TablesSettings,
      component: Tables, */
    },
  ]

  const panes = paneTypes.map(({ icon, label }) => ({
    menuItem: { icon, content: label },
    render: () => (
      <Tab.Pane>
        <Toggle
          cypress="creditsStudentsToggle"
          toolTips={null}
          firstLabel="Show credits"
          secondLabel="Show students"
          value={showStudents}
          setValue={handleShowStudentsChange}
        />
        <OverallStatsTable data={data} showStudents={showStudents} />
      </Tab.Pane>
    ),
  }))

  return (
    <div>
      <Tab id="CourseStatPanes" panes={panes} data-cy="CourseTabs" />
    </div>
  )
}

export default CourseTabs
