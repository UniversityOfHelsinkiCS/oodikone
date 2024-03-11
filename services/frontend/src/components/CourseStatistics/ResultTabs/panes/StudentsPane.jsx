import React from 'react'

import { Pane } from './Pane'
import { StudentsTable } from './tables/StudentsTable'

export const StudentsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'STUDENTS', separate, splitDirection: 'row' }}
      tableComponent={StudentsTable}
      updateQuery={updateQuery}
      userHasAccessToAllStats={userHasAccessToAllStats}
    />
  )
}
