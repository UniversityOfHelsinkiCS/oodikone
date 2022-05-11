import React from 'react'
import { Tab } from 'semantic-ui-react'
import OverallStatsTable from './OverallStatsTable'

const CourseTabs = ({ data }) => {
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
        <OverallStatsTable data={data} />
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
