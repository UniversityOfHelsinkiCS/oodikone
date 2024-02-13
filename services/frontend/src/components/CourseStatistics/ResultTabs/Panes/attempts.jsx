import React from 'react'
import { AttemptsTable } from './Tables/attempts'
import { AttemptsTableSettings } from './Settings/attempts'
import { Pane } from './Pane'

export const AttemptsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'ATTEMPTS', separate }}
      settingsComponent={AttemptsTableSettings}
      tableComponent={AttemptsTable}
      userHasAccessToAllStats={userHasAccessToAllStats}
      updateQuery={updateQuery}
    />
  )
}
