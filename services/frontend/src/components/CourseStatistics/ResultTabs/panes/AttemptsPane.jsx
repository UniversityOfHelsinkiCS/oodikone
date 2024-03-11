import React from 'react'

import { Pane } from './Pane'
import { AttemptsTable } from './tables/AttemptsTable'

export const AttemptsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'ATTEMPTS', separate, splitDirection: 'row' }}
      tableComponent={AttemptsTable}
      updateQuery={updateQuery}
      userHasAccessToAllStats={userHasAccessToAllStats}
    />
  )
}
