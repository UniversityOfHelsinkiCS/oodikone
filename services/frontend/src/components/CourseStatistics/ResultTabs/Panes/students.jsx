import React from 'react'
import { StudentsTable } from './Tables/students'
import { StudentsTableSettings } from './Settings/students'
import { Pane } from './Pane'

export const StudentsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'STUDENTS', separate, showDetails: false }}
      settingsComponent={StudentsTableSettings}
      tableComponent={StudentsTable}
      userHasAccessToAllStats={userHasAccessToAllStats}
      updateQuery={updateQuery}
    />
  )
}
