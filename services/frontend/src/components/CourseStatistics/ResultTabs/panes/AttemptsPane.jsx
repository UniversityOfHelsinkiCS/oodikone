import React from 'react'
import { Pane } from './common/Pane'
import { AttemptsTable } from './tables/AttemptsTable'
import { AttemptsTableSettings } from './settings/AttemptsTableSettings'

export const AttemptsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'ATTEMPTS', separate, splitDirection: 'row' }}
      settingsComponent={AttemptsTableSettings}
      tableComponent={AttemptsTable}
      userHasAccessToAllStats={userHasAccessToAllStats}
      updateQuery={updateQuery}
    />
  )
}
