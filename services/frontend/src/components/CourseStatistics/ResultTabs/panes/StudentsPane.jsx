import React from 'react'
import { StudentsTable } from './tables/StudentsTable'
import { StudentsTableSettings } from './settings/StudentsTableSettings'
import { Pane } from './common/Pane'

export const StudentsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'STUDENTS', separate, showDetails: false, splitDirection: 'row' }}
      settingsComponent={StudentsTableSettings}
      tableComponent={StudentsTable}
      userHasAccessToAllStats={userHasAccessToAllStats}
      updateQuery={updateQuery}
    />
  )
}
